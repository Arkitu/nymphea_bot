import path from 'path';
import pack, { Database } from 'sqlite3';
const sqlite3 = pack.verbose();

export interface User {
    id: string;
    username: string;
}

export interface Character {
    user_id: string;
    name: string;
    avatar_url?: string;
}

export interface Item {
    name: string;
    emoji: string;
}

export interface CharacterItem {
    character_name: string;
    item_name: string;
    quantity: number;
}

export interface Spirit {
    character_name: string;
    death_date: Date;
    // 0: common, 1: rare, 2: legendary
    rarity: number;
}

export default class DB {
    private realDB: Database;
    constructor() {
        this.realDB = new sqlite3.Database(path.join(process.cwd(), "db.sqlite"));
    }

    createTables() {
        return Promise.all([
            new Promise<void>((resolve, reject) => {
                this.realDB.run(
                    `CREATE TABLE IF NOT EXISTS users (
                        id TEXT NOT NULL,
                        username TEXT NOT NULL,
                        PRIMARY KEY (id)
                    )`, (err) => {
                        if (err) reject(err);
                        resolve();
                    }
                )
            }),
            new Promise<void>((resolve, reject) => {
                this.realDB.run(
                    `CREATE TABLE IF NOT EXISTS characters (
                        name TEXT NOT NULL,
                        user_id TEXT NOT NULL,
                        avatar_url TEXT,
                        PRIMARY KEY (name),
                        FOREIGN KEY (user_id) REFERENCES users(id)
                    )`, (err) => {
                        if (err) reject(err);
                        resolve();
                    }
                )
            }),
            new Promise<void>((resolve, reject) => {
                this.realDB.run(
                    `CREATE TABLE IF NOT EXISTS items (
                        name TEXT,
                        emoji CHAR(1),
                        PRIMARY KEY (name)
                    )`, (err) => {
                        if (err) reject(err);

                        // Create money item
                        this.realDB.run(
                            `INSERT OR IGNORE INTO items (name, emoji) VALUES (?, ?)`,
                            ['nymphéos', '💰'],
                            (err) => {
                                if (err) reject(err);
                                resolve();
                            }
                        )
                    }
                )
            }),
            new Promise<void>((resolve, reject) => {
                this.realDB.run(
                    `CREATE TABLE IF NOT EXISTS characters_items (
                        character_name TEXT NOT NULL,
                        item_name TEXT NOT NULL,
                        quantity INTEGER NOT NULL,
                        PRIMARY KEY (character_name, item_name),
                        FOREIGN KEY (character_name) REFERENCES characters(name),
                        FOREIGN KEY (item_name) REFERENCES items(name)
                    )`, (err) => {
                        if (err) reject(err);
                        resolve();
                    }
                )
            }),
            new Promise<void>((resolve, reject) => {
                this.realDB.run(
                    `CREATE TABLE IF NOT EXISTS spirits (
                        character_name TEXT NOT NULL,
                        death_date INT NOT NULL,
                        rarity INTEGER NOT NULL,
                        PRIMARY KEY (character_name),
                        FOREIGN KEY (character_name) REFERENCES characters(name)
                    )`, (err) => {
                        if (err) reject(err);
                        resolve();
                    }
                )
            })
        ]);
    }

    // Users

    getUser(id: string): Promise<User> {
        return new Promise((resolve, reject) => {
            this.realDB.get("SELECT * FROM users WHERE id = ?", [id], (err, row) => {
                if (err) reject(err);
                resolve(row as User);
            })
        })
    }

    createUser(id: string, username: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.realDB.run("INSERT INTO users (id, username) VALUES (?, ?)", [id, username], (err) => {
                if (err) reject(err);
                resolve();
            })
        })
    }

    createUserIfNotExists(id: string, username: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.realDB.run("INSERT OR IGNORE INTO users (id, username) VALUES (?, ?)", [id, username], (err) => {
                if (err) reject(err);
                resolve();
            })
        })
    }

    updateUser(user_id: string, username: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.createUserIfNotExists(user_id, username).then(() => {
                this.realDB.run("UPDATE users SET username = ? WHERE id = ?", [username, user_id], (err) => {
                    if (err) reject(err);
                    resolve();
                })
            })
        })
    }

    updateOrCreateUser(user_id: string, username: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.createUserIfNotExists(user_id, username).then(() => {
                this.updateUser(user_id, username).then(resolve).catch(reject);
            })
        })
    }

    getAllUsers(): Promise<User[]> {
        return new Promise((resolve, reject) => {
            this.realDB.all("SELECT * FROM users", (err, rows) => {
                if (err) reject(err);
                resolve(rows as User[]);
            })
        })
    }

    // Characters

    getCharacter(name: string): Promise<Character> {
        return new Promise((resolve, reject) => {
            this.realDB.get("SELECT * FROM characters WHERE name = ?", [name], (err, row) => {
                if (err) reject(err);
                resolve(row as Character);
            })
        })
    }

    getCharactersOfUser(user_id: string): Promise<Character[]> {
        return new Promise((resolve, reject) => {
            this.realDB.all("SELECT * FROM characters WHERE user_id = ?", [user_id], (err, rows) => {
                if (err) reject(err);
                resolve(rows as Character[]);
            })
        })
    }

    createCharacter(user_id: string, name: string, avatar_url?: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (avatar_url) {
                this.realDB.run("INSERT INTO characters (user_id, name, avatar_url) VALUES (?, ?, ?)", [user_id, name, avatar_url], (err) => {
                    if (err) reject(err);
                    resolve();
                })
            } else {
                this.realDB.run("INSERT INTO characters (user_id, name) VALUES (?, ?)", [user_id, name], (err) => {
                    if (err) reject(err);
                    resolve();
                })
            }
        })
    }

    removeCharacter(name: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.realDB.run("DELETE FROM characters WHERE name = ?", [name], (err) => {
                if (err) reject(err);
                resolve();
            })
        })
    }

    updateCharacter(name: string, avatar_url?: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (avatar_url) {
                this.realDB.run("UPDATE characters SET avatar_url = ? WHERE name = ?", [avatar_url, name], (err) => {
                    if (err) reject(err);
                    resolve();
                })
            } else {
                this.realDB.run("UPDATE characters SET avatar_url = NULL WHERE name = ?", [name], (err) => {
                    if (err) reject(err);
                    resolve();
                })
            }
        })
    }

    getAllCharacters(): Promise<Character[]> {
        return new Promise((resolve, reject) => {
            this.realDB.all("SELECT * FROM characters", (err, rows) => {
                if (err) reject(err);
                resolve(rows as Character[]);
            })
        })
    }

    // Items

    getItem(name: string): Promise<Item> {
        return new Promise((resolve, reject) => {
            this.realDB.get("SELECT * FROM items WHERE name = ?", [name], (err, row) => {
                if (err) reject(err);
                resolve(row as Item);
            })
        })
    }

    createItem(name: string, emoji: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.realDB.run("INSERT INTO items (name, emoji) VALUES (?, ?)", [name, emoji], (err) => {
                if (err) reject(err);
                resolve();
            })
        })
    }

    createItemIfNotExists(name: string, emoji: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.realDB.run("INSERT OR IGNORE INTO items (name, emoji) VALUES (?, ?)", [name, emoji], (err) => {
                if (err) reject(err);
                resolve();
            })
        })
    }

    updateItem(item: Item): Promise<void> {
        return new Promise((resolve, reject) => {
            this.realDB.run("UPDATE items SET emoji = ? WHERE name = ?", [item.emoji, item.name], (err) => {
                if (err) reject(err);
                resolve();
            })
        })
    }

    updateOrCreateItem(item: Item): Promise<void> {
        return new Promise((resolve, reject) => {
            this.createItemIfNotExists(item.name, item.emoji).then(() => {
                this.updateItem(item).then(resolve).catch(reject);
            })
        })
    }

    getAllItems(): Promise<Item[]> {
        return new Promise((resolve, reject) => {
            this.realDB.all("SELECT * FROM items", (err, rows) => {
                if (err) reject(err);
                resolve(rows as Item[]);
            })
        })
    }

    // Items in characters

    getItemsFromCharacter(char_name: string): Promise<{ [key: string] : number }> {
        return new Promise((resolve, reject) => {
            this.realDB.all("SELECT * FROM characters_items WHERE character_name = ?", [char_name], (err, rows: CharacterItem[]) => {
                if (err) reject(err);
                const items: { [key: string] : number } = {};
                for (let row of rows) {
                    items[row.item_name] = row.quantity;
                }
                resolve(items);
            })
        })
    }

    getItemFromCharacter(char_name: string, item_name: string): Promise<CharacterItem> {
        return new Promise((resolve, reject) => {
            this.realDB.get("SELECT * FROM characters_items WHERE character_name = ? AND item_name = ?", [char_name, item_name], (err, row) => {
                if (err) reject(err);
                resolve(row as CharacterItem);
            })
        })
    }

    /**
     * @throws Error if user doesn't have enough items
     */
    removeItemFromCharacter(char_name: string, item_name: string, quantity: number|null): Promise<void> {
        return new Promise((resolve, reject) => {
            if (quantity == null) {
                this.realDB.run("DELETE FROM characters_items WHERE character_name = ? AND item_name = ?", [char_name, item_name], (err) => {
                    if (err) reject(err);
                    resolve();
                })
            } else {
                // Check if user has enough items
                this.getItemFromCharacter(char_name, item_name).then((item) => {
                    if (item.quantity < quantity) {
                        reject(new Error("User doesn't have enough items"));
                    }

                    // If user quantity is the same as the quantity to remove, delete the row
                    if (item.quantity == quantity) {
                        this.realDB.run("DELETE FROM characters_items WHERE character_name = ? AND item_name = ?", [char_name, item_name], (err) => {
                            if (err) reject(err);
                            resolve();
                        })
                    }

                    // If user quantity is greater than the quantity to remove, update the quantity
                    if (item.quantity > quantity) {
                        this.realDB.run("UPDATE characters_items SET quantity = quantity - ? WHERE char_name = ? AND item_name = ?", [quantity, char_name, item_name], (err) => {
                            if (err) reject(err);
                            resolve();
                        })
                    }
                }).catch(reject);
            }
        })
    }

    addItemToCharacter(char_name: string, item_name: string, quantity: number): Promise<void> {
        return new Promise((resolve, reject) => {
            // Check if user already has item
            this.realDB.get("SELECT * FROM characters_items WHERE character_name = ? AND item_name = ?", [char_name, item_name], (err, row) => {
                if (err) reject(err);

                if (row) {
                    // If user already has item, update quantity
                    this.realDB.run("UPDATE characters_items SET quantity = quantity + ? WHERE character_name = ? AND item_name = ?", [quantity, char_name, item_name], (err) => {
                        if (err) reject(err);
                        resolve();
                    })
                } else {
                    // If user doesn't have item, add it
                    this.realDB.run("INSERT INTO characters_items (character_name, item_name, quantity) VALUES (?, ?, ?)", [char_name, item_name, quantity], (err) => {
                        if (err) reject(err);
                        resolve();
                    })
                }
            })
        })
    }

    giveItem(giver_name: string, receiver_name: string, item_name: string, quantity: number|null): Promise<void> {
        return new Promise(async (resolve, reject) => {
            if (quantity == null) {
                quantity = (await this.getItemFromCharacter(giver_name, item_name)).quantity;
            }

            // Remove item from giver
            await this.removeItemFromCharacter(giver_name, item_name, quantity);

            // Add item to receiver
            await this.addItemToCharacter(receiver_name, item_name, quantity);

            resolve();
        })
    }

    addItemToCharacterOrCreate(char_name: string, item_name: string, item_emoji: string, quantity: number): Promise<void> {
        return new Promise((resolve, reject) => {
            // Add item if don't exist
            this.realDB.run("INSERT OR IGNORE INTO items (name, emoji) VALUES (?, ?)", [item_name, item_emoji], (err) => {
                if (err) reject(err);

                // Add item to user
                this.addItemToCharacter(char_name, item_name, quantity).then(resolve);
            })
        })
    }

    // Spirit
    removeSpirit(char_name: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.realDB.run("DELETE FROM spirits WHERE character_name = ?", [char_name], (err) => {
                if (err) reject(err);
                resolve();
            })
        })
    }

    createSpirit(char_name: string, death_date: Date, rarity: number): Promise<void> {
        return new Promise((resolve, reject) => {
            this.removeSpirit(char_name).then(() => {
                this.realDB.run("INSERT INTO spirits (character_name, death_date, rarity) VALUES (?, ?, ?)", [char_name, death_date.getTime(), rarity], (err) => {
                    if (err) reject(err);
                    resolve();
                })
            }).catch(reject);
        })
    }

    getSpiritBase(char_name: string): Promise<Spirit|null> {
        return new Promise((resolve, reject) => {
            this.realDB.get("SELECT * FROM spirits WHERE character_name = ?", [char_name], (err, row: {
                character_name: string,
                death_date: number,
                rarity: number
            }|undefined) => {
                if (err) reject(err)
                if (!row) {
                    resolve(null);
                    return;
                }
                
                resolve({
                    character_name: row.character_name,
                    death_date: new Date(row.death_date),
                    rarity: row.rarity
                });
            })
        })
    }

    getSpirit(char_name: string): Promise<Spirit|null> {
        return new Promise((resolve, reject) => {
            this.getSpiritBase(char_name).then((spirit) => {
                if (!spirit) {
                    resolve(null);
                    return;
                }

                if (spirit.death_date < new Date()) {
                    resolve(null);
                } else {
                    resolve(spirit);
                }
            }).catch(reject);
        })
    }
}
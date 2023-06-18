import path from 'path';
import pack, { Database } from 'sqlite3';
const sqlite3 = pack.verbose();

export interface User {
    id: string;
    username: string;
}

export interface Item {
    name: string;
    emoji: string;
}

export interface UserItem {
    user_id: string;
    item_name: string;
    quantity: number;
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
                        id TEXT,
                        username TEXT,
                        PRIMARY KEY (id)
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
                        resolve();
                    }
                )
            }),
            new Promise<void>((resolve, reject) => {
                this.realDB.run(
                    `CREATE TABLE IF NOT EXISTS user_items (
                        user_id TEXT,
                        item_name TEXT,
                        quantity INTEGER,
                        PRIMARY KEY (user_id, item_name),
                        FOREIGN KEY (user_id) REFERENCES users(id),
                        FOREIGN KEY (item_name) REFERENCES items(name)
                    )`, (err) => {
                        if (err) reject(err);
                        resolve();
                    }
                )
            })
        ]);
    }

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

    getItemsFromUser(user_id: string): Promise<{ [key: string] : number }> {
        return new Promise((resolve, reject) => {
            this.realDB.all("SELECT * FROM user_items WHERE user_id = ?", [user_id], (err, rows: UserItem[]) => {
                if (err) reject(err);
                const items: { [key: string] : number } = {};
                for (let row of rows) {
                    items[row.item_name] = row.quantity;
                }
                resolve(items);
            })
        })
    }

    getItemFromUser(user_id: string, item_name: string): Promise<UserItem> {
        return new Promise((resolve, reject) => {
            this.realDB.get("SELECT * FROM user_items WHERE user_id = ? AND item_name = ?", [user_id, item_name], (err, row) => {
                if (err) reject(err);
                resolve(row as UserItem);
            })
        })
    }

    /**
     * @throws Error if user doesn't have enough items
     */
    removeItemFromUser(user_id: string, item_name: string, quantity: number|null): Promise<void> {
        return new Promise((resolve, reject) => {
            if (quantity == null) {
                this.realDB.run("DELETE FROM user_items WHERE user_id = ? AND item_name = ?", [user_id, item_name], (err) => {
                    if (err) reject(err);
                    resolve();
                })
            } else {
                // Check if user has enough items
                this.getItemFromUser(user_id, item_name).then((item) => {
                    if (item.quantity < quantity) {
                        reject(new Error("User doesn't have enough items"));
                    }

                    // If user quantity is the same as the quantity to remove, delete the row
                    if (item.quantity == quantity) {
                        this.realDB.run("DELETE FROM user_items WHERE user_id = ? AND item_name = ?", [user_id, item_name], (err) => {
                            if (err) reject(err);
                            resolve();
                        })
                    }

                    // If user quantity is greater than the quantity to remove, update the quantity
                    if (item.quantity > quantity) {
                        this.realDB.run("UPDATE user_items SET quantity = quantity - ? WHERE user_id = ? AND item_name = ?", [quantity, user_id, item_name], (err) => {
                            if (err) reject(err);
                            resolve();
                        })
                    }
                }).catch(reject);
            }
        })
    }

    addItemToUser(user_id: string, item_name: string, quantity: number): Promise<void> {
        return new Promise((resolve, reject) => {
            // Check if user already has item
            this.realDB.get("SELECT * FROM user_items WHERE user_id = ? AND item_name = ?", [user_id, item_name], (err, row) => {
                if (err) reject(err);

                if (row) {
                    // If user already has item, update quantity
                    this.realDB.run("UPDATE user_items SET quantity = quantity + ? WHERE user_id = ? AND item_name = ?", [quantity, user_id, item_name], (err) => {
                        if (err) reject(err);
                        resolve();
                    })
                } else {
                    // If user doesn't have item, add it
                    this.realDB.run("INSERT INTO user_items (user_id, item_name, quantity) VALUES (?, ?, ?)", [user_id, item_name, quantity], (err) => {
                        if (err) reject(err);
                        resolve();
                    })
                }
            })
        })
    }

    giveItem(giver_id: string, receiver_id: string, item_name: string, quantity: number|null): Promise<void> {
        return new Promise(async (resolve, reject) => {
            if (quantity == null) {
                quantity = (await this.getItemFromUser(giver_id, item_name)).quantity;
            }

            // Remove item from giver
            await this.removeItemFromUser(giver_id, item_name, quantity);

            // Add item to receiver
            await this.addItemToUser(receiver_id, item_name, quantity);

            resolve();
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

    addItemToUserOrCreate(user_id: string, user_name: string, item_name: string, item_emoji: string, quantity: number): Promise<void> {
        return new Promise((resolve, reject) => {
            // Add user if don't exist
            this.realDB.run("INSERT OR IGNORE INTO users (id, username) VALUES (?, ?)", [user_id, user_name], (err) => {
                if (err) reject(err);

                // Add item if don't exist
                this.realDB.run("INSERT OR IGNORE INTO items (name, emoji) VALUES (?, ?)", [item_name, item_emoji], (err) => {
                    if (err) reject(err);

                    // Add item to user
                    this.addItemToUser(user_id, item_name, quantity).then(resolve);
                })
            })
        })
    }
}
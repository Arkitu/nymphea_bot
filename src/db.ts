import path from 'path';
import pack, { Database } from 'sqlite3';
const sqlite3 = pack.verbose();

export interface User {
    id: string;
    username: string;
}

export interface Item {
    id: string;
    user_id: string;
    name: string;
    emoji: string;
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
                        id TEXT PRIMARY KEY,
                        username TEXT
                    )`, (err) => {
                    if (err) reject(err);
                    resolve();
                })
            }),
            new Promise<void>((resolve, reject) => {
                this.realDB.run(
                    `CREATE TABLE IF NOT EXISTS items (
                        id TEXT PRIMARY KEY,
                        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
                        name TEXT,
                        emoji CHAR(1),
                        quantity INTEGER
                    )`, (err) => {
                    if (err) reject(err);
                    resolve();
                })
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

    updateUser(user: User): Promise<void> {
        return new Promise((resolve, reject) => {
            this.realDB.run("UPDATE users SET username = ? WHERE id = ?", [user.username, user.id], (err) => {
                if (err) reject(err);
                resolve();
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

    getItem(id: string): Promise<Item> {
        return new Promise((resolve, reject) => {
            this.realDB.get("SELECT * FROM items WHERE id = ?", [id], (err, row) => {
                if (err) reject(err);
                resolve(row as Item);
            })
        })
    }

    createItem(id: string, user_id: string, name: string, emoji: string, quantity: number): Promise<void> {
        return new Promise((resolve, reject) => {
            this.realDB.run("INSERT INTO items (id, user_id, name, emoji, quantity) VALUES (?, ?, ?, ?, ?)", [id, user_id, name, emoji, quantity], (err) => {
                if (err) reject(err);
                resolve();
            })
        })
    }

    updateItem(item: Item): Promise<void> {
        return new Promise((resolve, reject) => {
            this.realDB.run("UPDATE items SET user_id = ?, name = ?, emoji = ?, quantity = ? WHERE id = ?", [item.user_id, item.name, item.emoji, item.quantity, item.id], (err) => {
                if (err) reject(err);
                resolve();
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
}
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

// 数据库文件路径
const DB_PATH = path.join(__dirname, 'users.db');

let db;

// 初始化数据库
async function initDatabase() {
  const SQL = await initSqlJs();

  // 如果数据库文件存在，则加载它
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
    console.log('已加载现有数据库');
  } else {
    db = new SQL.Database();
    console.log('创建新数据库');
  }

  // 创建用户表
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 作品存储表（key 区分来源，如 media_studio / cn_dh / intl_dh；data 为 JSON 数组）
  db.run(`
    CREATE TABLE IF NOT EXISTS works_store (
      key TEXT PRIMARY KEY,
      data TEXT NOT NULL DEFAULT '[]',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  saveDatabase();
  console.log('数据库初始化完成');
}

// 保存数据库到文件
function saveDatabase() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// 获取数据库实例
function getDb() {
  if (!db) {
    throw new Error('数据库尚未初始化，请先调用 initDatabase()');
  }
  return db;
}

// 读取作品列表（key 如 'media_studio_works'）
function getWorksStore(key) {
  const database = getDb();
  const r = database.exec('SELECT data FROM works_store WHERE key = ?', [key]);
  if (!r.length || !r[0].values.length) return [];
  try {
    return JSON.parse(r[0].values[0][0] || '[]');
  } catch (e) {
    return [];
  }
}

// 保存作品列表
function setWorksStore(key, list) {
  const database = getDb();
  const data = JSON.stringify(Array.isArray(list) ? list : []);
  database.run(
    'INSERT OR REPLACE INTO works_store (key, data, updated_at) VALUES (?, ?, datetime("now"))',
    [key, data]
  );
  saveDatabase();
}

module.exports = {
  initDatabase,
  saveDatabase,
  getDb,
  getWorksStore,
  setWorksStore,
  DB_PATH,
};


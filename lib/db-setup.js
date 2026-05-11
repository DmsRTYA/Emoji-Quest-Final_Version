const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function setup() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '3306'),
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
  });
  await conn.query(`CREATE DATABASE IF NOT EXISTS emoji_quest CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.query(`USE emoji_quest`);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      username     VARCHAR(50)  UNIQUE NOT NULL,
      email        VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL DEFAULT '',
      avatar_color VARCHAR(20)  DEFAULT '#00F5FF',
      avatar_url   MEDIUMTEXT   DEFAULT NULL,
      google_id    VARCHAR(128) DEFAULT NULL,
      google_avatar VARCHAR(512) DEFAULT NULL,
      rank_tier    ENUM('bronze','silver','gold','platinum','diamond','master') DEFAULT 'bronze',
      casual_score INT DEFAULT 0,
      rank_score   INT DEFAULT 0,
      pvp_wins     INT DEFAULT 0,
      pvp_losses   INT DEFAULT 0,
      total_games  INT DEFAULT 0,
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // Safe migrations for existing tables
  const cols = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url MEDIUMTEXT DEFAULT NULL",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(128) DEFAULT NULL",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS google_avatar VARCHAR(512) DEFAULT NULL",
    "ALTER TABLE users MODIFY COLUMN rank_score INT DEFAULT 0",
  ];
  for (const sql of cols) { try { await conn.query(sql); } catch(_){} }

  await conn.query(`
    CREATE TABLE IF NOT EXISTS game_sessions (
      id                VARCHAR(36) PRIMARY KEY,
      user_id           INT,
      mode              ENUM('casual','rank','pvp') NOT NULL,
      score             INT DEFAULT 0,
      questions_answered INT DEFAULT 0,
      correct_answers   INT DEFAULT 0,
      status            ENUM('playing','finished','abandoned') DEFAULT 'playing',
      created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS leaderboard_entries (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      user_id    INT NOT NULL,
      mode       ENUM('casual','rank','pvp') NOT NULL,
      score      INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  console.log('✅ Database setup complete!');
  await conn.end();
}

setup().catch(console.error);

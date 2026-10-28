const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: 'postgres',
  host: 'db', 
  database: 'bookdb',
  password: 'mypassword',
  port: 5432,
});

const createTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS books (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        author VARCHAR(100) DEFAULT '未知作者',
        category VARCHAR(50) DEFAULT '其他',
        status VARCHAR(20) DEFAULT '在馆',
        borrower VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        borrow_time TIMESTAMP,
        due_time TIMESTAMP,
        return_time TIMESTAMP
      );
    `);
    console.log("✅ 数据库表（终极版）准备就绪！");
  } catch (err) {
    setTimeout(createTable, 3000);
  }
};
createTable();

// API：查书（**这里必须要有 async**）
app.get('/api/books', async (req, res) => {
  try {
    const { search, category, page = 1, limit = 5 } = req.query;
    const offset = (page - 1) * limit;
    
    let baseQuery = 'FROM books WHERE 1=1';
    let params = [];
    let paramCount = 1;

    if (search) {
      baseQuery += ` AND (name ILIKE $${paramCount} OR author ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }
    if (category && category !== '全部') {
      baseQuery += ` AND category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    // 查列表数据
    const dataQuery = `SELECT * ${baseQuery} ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    const dataResult = await pool.query(dataQuery, [...params, limit, offset]);

    // 查全局统计
    const totalRes = await pool.query(`SELECT COUNT(*) FROM books`);
    const inRes = await pool.query(`SELECT COUNT(*) FROM books WHERE status = '在馆'`);
    const outRes = await pool.query(`SELECT COUNT(*) FROM books WHERE status = '借出'`);

    // 查当前过滤条件下的总数（用于分页）
    const filteredCountRes = await pool.query(`SELECT COUNT(*) ${baseQuery}`, params);

    res.json({ 
      data: dataResult.rows, 
      totalFiltered: parseInt(filteredCountRes.rows[0].count),
      stats: {
        total: parseInt(totalRes.rows[0].count),
        in: parseInt(inRes.rows[0].count),
        out: parseInt(outRes.rows[0].count)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/books', async (req, res) => {
  try {
    const { name, author, category } = req.body;
    await pool.query('INSERT INTO books (name, author, category) VALUES ($1, $2, $3)', [name, author, category]);
    res.send('Added');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, borrower } = req.body;

    if (status === '借出') {
      await pool.query(
        `UPDATE books 
         SET status=$1, borrow_time=CURRENT_TIMESTAMP, due_time=CURRENT_TIMESTAMP + INTERVAL '30 days', return_time=NULL, borrower=$2 
         WHERE id=$3`,
        [status, borrower, id]
      );
    } else {
      await pool.query(
        'UPDATE books SET status=$1, return_time=CURRENT_TIMESTAMP, borrower=NULL WHERE id=$2',
        [status, id]
      );
    }
    res.send('Updated');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM books WHERE id = $1', [id]);
    res.send('Deleted');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use(express.static('./'));
app.listen(3000, () => console.log('🚀 后端服务已启动在 3000 端口'));
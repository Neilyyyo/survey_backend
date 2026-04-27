const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// GET all questions (Sorted by category first: demographics then survey)
app.get('/api/questions', async (req, res) => {
    try {
        const data = await pool.query("SELECT * FROM questions ORDER BY CASE WHEN category = 'demographic' THEN 1 ELSE 2 END, created_at ASC");
        res.json(data.rows);
    } catch (err) { res.status(500).send(err.message); }
});

// POST a timed response
app.post('/api/submit', async (req, res) => {
    const { question, answer, duration } = req.body;
    try {
        await pool.query('INSERT INTO survey_responses (question_text, answer, duration_seconds) VALUES ($1, $2, $3)', [question, answer, duration]);
        res.status(200).json({ status: "ok" });
    } catch (err) { res.status(500).send(err.message); }
});

// ADMIN: Add question
app.post('/api/admin/questions', async (req, res) => {
    const { text, category, is_required } = req.body;
    try {
        await pool.query('INSERT INTO questions (text, category, is_required) VALUES ($1, $2, $3)', [text, category, is_required]);
        res.json({ status: "added" });
    } catch (err) { res.status(500).send(err.message); }
});

// ADMIN: View results
app.get('/api/admin/results', async (req, res) => {
    try {
        const data = await pool.query('SELECT * FROM survey_responses ORDER BY created_at DESC');
        res.json(data.rows);
    } catch (err) { res.status(500).send(err.message); }
});

app.listen(process.env.PORT || 3000);
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Supabase/Render
});

// --- USER ROUTES ---

// Get all active questions for the survey
app.get('/api/questions', async (req, res) => {
    try {
        const data = await pool.query('SELECT * FROM questions ORDER BY created_at DESC');
        res.json(data.rows);
    } catch (err) { res.status(500).json(err); }
});

// Submit a timed response
app.post('/api/submit', async (req, res) => {
    const { question, answer, duration } = req.body;
    try {
        await pool.query(
            'INSERT INTO survey_responses (question_text, answer, duration_seconds) VALUES ($1, $2, $3)',
            [question, answer, duration]
        );
        res.status(200).json({ message: "Saved" });
    } catch (err) { res.status(500).json(err); }
});

// --- ADMIN ROUTES ---

// Admin: Add a new question
app.post('/api/admin/questions', async (req, res) => {
    const { text } = req.body;
    try {
        await pool.query('INSERT INTO questions (text) VALUES ($1)', [text]);
        res.status(200).json({ message: "Question Added" });
    } catch (err) { res.status(500).json(err); }
});

// Admin: View all results
app.get('/api/admin/results', async (req, res) => {
    try {
        const data = await pool.query('SELECT * FROM survey_responses ORDER BY created_at DESC');
        res.json(data.rows);
    } catch (err) { res.status(500).json(err); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
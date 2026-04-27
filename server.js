const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());

// CORS configuration - allows frontend to connect
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5500', 'http://localhost:8000', 'http://127.0.0.1:5500', '*'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is running' });
});

// GET all questions (Sorted by category first: demographics then survey)
app.get('/api/questions', async (req, res) => {
    try {
        const data = await pool.query("SELECT * FROM questions ORDER BY CASE WHEN category = 'demographic' THEN 1 ELSE 2 END, created_at ASC");
        res.json(data.rows);
    } catch (err) { 
        console.error('GET /api/questions error:', err);
        res.status(500).json({ error: err.message }); 
    }
});

// POST a timed response
app.post('/api/submit', async (req, res) => {
    const { respondent_id, question, answer, duration } = req.body;
    
    // Validate required fields
    if (!respondent_id || !question || !answer) {
        return res.status(400).json({ error: 'Missing required fields: respondent_id, question, answer' });
    }

    try {
        await pool.query(
            'INSERT INTO survey_responses (respondent_id, question_text, answer, duration_seconds) VALUES ($1, $2, $3, $4)',
            [respondent_id, question, answer, duration || 0]
        );
        res.status(200).json({ status: "ok", message: "Response saved" });
    } catch (err) { 
        console.error('POST /api/submit error:', err);
        res.status(500).json({ error: err.message }); 
    }
});

// ADMIN: View results
app.get('/api/admin/results', async (req, res) => {
    try {
        const data = await pool.query('SELECT * FROM survey_responses ORDER BY respondent_id ASC, created_at ASC');
        res.json(data.rows);
    } catch (err) { 
        console.error('GET /api/admin/results error:', err);
        res.status(500).json({ error: err.message }); 
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✓ Survey backend running on http://localhost:${PORT}`);
    console.log(`✓ API endpoints:`);
    console.log(`  - GET  ${PORT}/api/health`);
    console.log(`  - GET  ${PORT}/api/questions`);
    console.log(`  - POST ${PORT}/api/submit`);
    console.log(`  - GET  ${PORT}/api/admin/results`);
});
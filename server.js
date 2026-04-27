const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Endpoint to save responses
app.post('/submit', async (req, res) => {
    const { question, answer, duration } = req.body;
    try {
        await pool.query(
            'INSERT INTO survey_responses (question, answer, duration_seconds) VALUES ($1, $2, $3)',
            [question, answer, duration]
        );
        res.status(200).send("Saved");
    } catch (err) { res.status(500).send(err.message); }
});

// Endpoint for Admin to see results
app.get('/results', async (req, res) => {
    const data = await pool.query('SELECT * FROM survey_responses');
    res.json(data.rows);
});

app.listen(process.env.PORT || 3000);
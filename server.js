// server.js - Node.js + Express.js static server + REST API

const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // Enable CORS for cross-origin requests

const app = express();
const PORT = 5500;

// Enable CORS (optional, but recommended for local dev)
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

app.use(express.static(__dirname));

// Path to data folder
const dataDir = path.join(__dirname, 'data');

// ----------- GENERAL DATA APIs -----------
// GET /api/data/:filename — Read any JSON file in /data
app.get('/api/data/:filename', (req, res) => {
    const filePath = path.join(dataDir, req.params.filename);
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(404).json({ error: 'File not found' });
        try {
            res.json(JSON.parse(data));
        } catch (parseErr) {
            res.status(500).json({ error: 'Invalid JSON format' });
        }
    });
});
// POST /api/data/:filename — Overwrite any JSON file in /data
app.post('/api/data/:filename', (req, res) => {
    const filePath = path.join(dataDir, req.params.filename);
    const jsonData = req.body;
    fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), (err) => {
        if (err) return res.status(500).json({ error: 'Write failed' });
        res.json({ message: 'File updated successfully' });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
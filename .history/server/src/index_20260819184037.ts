import express from "express";

const app = express();
const PORT = 3001;

app.get('api/health', (_req, res) => {
    res.json({
        ok: true
    })
})
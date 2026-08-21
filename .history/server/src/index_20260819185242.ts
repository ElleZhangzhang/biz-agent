import express from "express";

const app = express();
const PORT = 3001;

app.get('/api/health', (_req, res) => {
    res.json({
        ok: true
    })
})
app.listen(PORT, () => {
    console.log('biz-agent server listening on http://localhost:' + PORT);
})
const express = require('express');
require('dotenv').config()
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');

const app = express();
const port = 5000;



app.use(cors());

app.get('/', async (req, res) => {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = req.query.prompt || 'Write a story about a magic backpack.';
        const result = await model.generateContent(prompt);

        res.json({ text: result.response.text() });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate text' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

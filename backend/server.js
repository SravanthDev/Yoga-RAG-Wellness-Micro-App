
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { pipeline } = require('@xenova/transformers');
const { OpenAI } = require('openai');


const Log = require('./models/Log');
const retriever = require('./rag/retriever');
const safety = require('./safety/guardrails');

const app = express();
app.get('/', (req, res) => res.send('Yoga RAG Server Running'));
app.use(express.json());
app.use(cors());


const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/yoga_rag';
const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';

let embedder = null;
let openai = null;


async function init() {
    try {
        if (MONGO_URI) {
            await mongoose.connect(MONGO_URI);
            console.log('[DB] Connected to MongoDB');
        }
    } catch (e) {
        console.error('[DB] Failed to connect', e);
    }

    retriever.loadIndex();
    safety.loadSafetyIndex();

    console.log('[AI] Loading Embedder...');
    embedder = await pipeline('feature-extraction', MODEL_NAME);

    if (process.env.OPENAI_API_KEY) {
        openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        console.log('[AI] OpenAI Initialized');
    } else {
        console.warn('[AI] OPENAI_API_KEY not set. LLM will fail.');
    }
}

init();


const SAFE_SYSTEM_PROMPT = `You are a knowledgeable Yoga Wellness Assistant. 
Answer the user's question using ONLY the provided context snippets.
If the answer is not in the context, say "I don't know based on the available information."
Do not make up information.
Keep the tone calm, helpful, and concise.`;

const UNSAFE_SYSTEM_PROMPT = `You are a careful AI assistant. The user asked a query that was flagged as potentially unsafe (medical/pregnancy/injury).
Your goal is to gently Validated the user's interest but strictly REFUSE to give medical advice or specific pose prescriptions for this condition.
1. Warn the user that you cannot provide medical advice.
2. Suggest they consult a doctor or certified yoga therapist.
3. Suggest a safe, general alternative if applicable (e.g. "focus on deep breathing") but do NOT prescribe specific poses.
4. Be brief and supportive.`;


app.post('/ask', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) return res.status(400).json({ error: 'Query required' });

        const output = await embedder(query, { pooling: 'mean', normalize: true });
        const embedding = Array.from(output.data);

]        const { isUnsafe, reasons } = safety.checkSafety(query, embedding);

        let answer = "";
        let sources = [];
        let messages = [];

        if (isUnsafe) {
\            messages = [
                { role: "system", content: UNSAFE_SYSTEM_PROMPT },
                { role: "user", content: query }
            ];
        } else {
            const relevantChunks = retriever.search(embedding, 3);
            sources = relevantChunks.map(c => c.source);

            console.log("Top matches:", relevantChunks.map(c => `${c.source} (${c.score.toFixed(2)})`));

            if (relevantChunks.length === 0 || relevantChunks[0].score < 0.22) {
                answer = "I don't know based on the available information.";
            } else {
                const contextText = relevantChunks.map(c => `[${c.source}]: ${c.text}`).join('\n\n');
                messages = [
                    { role: "system", content: SAFE_SYSTEM_PROMPT },
                    { role: "user", content: `Context:\n${contextText}\n\nUser Question: ${query}` }
                ];
            }
        }

        if (!answer) {
            if (openai) {
                const completion = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: messages,
                });
                answer = completion.choices[0].message.content;
            } else {
                answer = "LLM not configured.";
            }
        }

        const log = new Log({
            query,
            answer,
            sources,
            isUnsafe,
            unsafeReasons: reasons
        });
        await log.save();

        res.json({
            answer,
            sources: isUnsafe ? [] : sources,
            isUnsafe,
            unsafeReasons: reasons,
            queryId: log._id
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/feedback', async (req, res) => {
    const { queryId, feedback } = req.body;
 

    if (queryId && feedback) {
        try {
            await Log.findByIdAndUpdate(queryId, { feedback }); 
            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ error: 'Log update failed' });
        }
    } else {
        res.status(400).json({ error: 'Invalid data' });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

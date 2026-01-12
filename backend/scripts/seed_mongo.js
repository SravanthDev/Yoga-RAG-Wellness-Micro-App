
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Article = require('../models/Article');

const MONGO_URI = process.env.MONGO_URI;
const DATA_FILE = path.join(__dirname, '../../data/articles.json');

async function seed() {
    if (!MONGO_URI) {
        console.error('MONGO_URI is missing in .env');
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGO_URI);
        console.log('[Seed] Connected to MongoDB');

        // 1. Load JSON Data
        const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
        const articles = JSON.parse(rawData);

        // 2. Clear existing articles
        await Article.deleteMany({});
        console.log('[Seed] Cleared existing articles');

        // 3. Insert new articles
        // Map to match schema if necessary, but fields roughly match
        const docs = articles.map(a => ({
            title: a.title,
            content: a.content
        }));

        await Article.insertMany(docs);
        console.log(`[Seed] Successfully inserted ${docs.length} articles into MongoDB`);

        process.exit(0);
    } catch (err) {
        console.error('[Seed] Error:', err);
        process.exit(1);
    }
}

seed();

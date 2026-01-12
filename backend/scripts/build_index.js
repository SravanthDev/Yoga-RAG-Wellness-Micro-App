
const fs = require('fs');
const path = require('path');
const { pipeline } = require('@xenova/transformers');
const uuid = require('uuid');

const mongoose = require('mongoose');
require('dotenv').config();
const Article = require('../models/Article');

const MONGO_URI = process.env.MONGO_URI;
const INDEX_FILE = path.join(__dirname, '../faiss/index.json');
const SAFETY_INTENTS_FILE = path.join(__dirname, '../safety/unsafe_intents.json');
const SAFETY_INDEX_FILE = path.join(__dirname, '../safety/safety_index.json');

const CHUNK_SIZE = 500;
const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';

async function main() {
  console.log('Starting DB-backed verification and indexing...');

  // 1. Hooking up to the real database to get fresh articles
  if (!MONGO_URI) { console.error('MONGO_URI missing'); process.exit(1); }
  await mongoose.connect(MONGO_URI);
  console.log('[Index] Connected to MongoDB');

  const articles = await Article.find({});
  console.log(`[Index] Loaded ${articles.length} articles from MongoDB.`);

  // 2. Setting up the model that turns text into vectors
  console.log('Loading embedding model...');
  const extractor = await pipeline('feature-extraction', MODEL_NAME);

  // 3. Processing each article: slicing and embedding
  const chunks = [];
  console.log('Chunking and embedding articles...');

  for (const article of articles) {
    const text = article.content;
    const title = article.title;

    // Cutting the text into pieces (chunks) so the AI can digest it easily
    for (let i = 0; i < text.length; i += CHUNK_SIZE) {
      const chunkText = text.slice(i, i + CHUNK_SIZE);
      if (chunkText.length < 50) continue; // Skip very small chunks

      const output = await extractor(chunkText, { pooling: 'mean', normalize: true });
      const embedding = Array.from(output.data);

      chunks.push({
        id: uuid.v4(),
        text: chunkText,
        source: title,
        embedding: embedding
      });
    }
  }

  // 4. Saving the vector index to a file (acting like a local FAISS)
  fs.writeFileSync(INDEX_FILE, JSON.stringify(chunks, null, 2));
  console.log(`Saved ${chunks.length} chunks to ${INDEX_FILE}`);

  // 5. Creating a separate index for unsafe topics so we can catch them later
  console.log('Building safety index...');
  if (fs.existsSync(SAFETY_INTENTS_FILE)) {
    const unsafeIntents = JSON.parse(fs.readFileSync(SAFETY_INTENTS_FILE, 'utf-8'));
    const safetyEmbeddings = [];

    for (const intent of unsafeIntents) {
      const output = await extractor(intent, { pooling: 'mean', normalize: true });
      const embedding = Array.from(output.data);
      safetyEmbeddings.push({
        text: intent,
        embedding: embedding
      });
    }

    fs.writeFileSync(SAFETY_INDEX_FILE, JSON.stringify(safetyEmbeddings, null, 2));
    console.log(`Saved ${safetyEmbeddings.length} safety intents to ${SAFETY_INDEX_FILE}`);
  } else {
    console.warn('No unsafe intents file found.');
  }

  console.log('Build complete.');
  await mongoose.disconnect();
}

main().catch(console.error);

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Simple .env parser
function loadEnv() {
  try {
    const envPath = path.resolve(__dirname, '../.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    });
  } catch (e) {
    console.log('.env file not found or readable, assuming env vars are set.');
  }
}

loadEnv();

async function enableVector() {
  console.log('Connecting to:', process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@')); // Mask password
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database.');
    
    console.log('Enabling vector extension...');
    await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log('Vector extension enabled successfully.');
    
  } catch (err) {
    console.error('Error enabling vector extension:', err);
    console.error('Hint: Make sure your Postgres user has superuser privileges or the extension is allowed on your cloud provider.');
  } finally {
    await client.end();
  }
}

enableVector();

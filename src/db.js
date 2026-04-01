import { MongoClient } from 'mongodb'

let client
let db

export async function getDb() {
  if (db) return db

  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('Missing MONGODB_URI in .env')
  }

  const dbName = process.env.DB_NAME || 'Chatgram'
  client = new MongoClient(uri)
  await client.connect()
  db = client.db(dbName)

  // Ensure a unique index for account keys
  await db.collection('users').createIndex({ key: 1 }, { unique: true })

  return db
}

export async function closeDb() {
  if (client) await client.close()
  client = undefined
  db = undefined
}


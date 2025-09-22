import { MongoClient } from 'mongodb'

let cached = global._mongo
if (!cached) cached = global._mongo = { conn: null, promise: null }

export async function getMongo() {
  const uri = process.env.MONGODB_URI
  const dbName = process.env.MONGODB_DB || 'slyos'
  if (!uri) throw new Error('MONGODB_URI not set (runtime)')

  if (cached.conn) return cached.conn
  if (!cached.promise) {
    const client = new MongoClient(uri, { maxPoolSize: 5 })
    cached.promise = client.connect().then((c) => ({
      client: c,
      db: c.db(dbName),
    }))
  }
  cached.conn = await cached.promise
  return cached.conn
}

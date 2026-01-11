import { MongoClient } from "mongodb";

if (!process.env.MONGO_API) {
    throw new Error('Invalid/Missing environment variable: "MONGO_API"');
}

const uri = process.env.MONGO_API;
const options = {};

let client;
let clientPromise: Promise<MongoClient>;

// Determine DB name based on environment
const dbName = process.env.NODE_ENV === "production" ? "attendance_prod" : "attendance_dev";

if (process.env.NODE_ENV === "development") {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    let globalWithMongo = global as typeof globalThis & {
        _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
        client = new MongoClient(uri, options);
        globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
} else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;
export { dbName };

export async function getDb() {
    const client = await clientPromise;
    return client.db(dbName);
}

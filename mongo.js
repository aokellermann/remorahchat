const {MongoClient, ServerApiVersion} = require("mongodb");

let _mongo;

async function mongo() {
    if (_mongo) return _mongo

    const client = new MongoClient(process.env.MONGO_CONN, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });

    await client.connect()
    _mongo = client.db("RemorahChat")
    return _mongo
}

async function aggregate(collection, pipeline) {
    const client = await mongo()
    const cursor = await client.collection(collection).aggregate(pipeline)
    return await cursor.toArray()
}

module.exports = {
    mongo,
    aggregate
}
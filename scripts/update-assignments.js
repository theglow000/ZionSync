const { MongoClient } = require('mongodb');

// Get your connection string from MongoDB Atlas
const uri = "mongodb+srv://theglow000:Urbane36$@zionsignupsheet.gt7uf.mongodb.net/?retryWrites=true&w=majority&appName=ZionSignupSheet"

async function updateAssignments() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db("church");
        const collection = db.collection("worship_assignments");

        // First, log current state
        const before = await collection.find({}).toArray();
        console.log('Current assignments:', before);

        // Update documents
        const result = await collection.updateMany(
            { songsApproved: { $exists: false } },
            { $set: { songsApproved: false } }
        );

        // Verify update
        const after = await collection.find({}).toArray();
        console.log('Updated assignments:', after);

        console.log(`Updated ${result.modifiedCount} documents`);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

updateAssignments();
const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://theglow000:Urbane36$@zionsignupsheet.gt7uf.mongodb.net/?retryWrites=true&w=majority&appName=ZionSignupSheet";

async function fixPartialApprovals() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db("church");
    const collection = db.collection("worship_assignments");

    // Update specific services we know about
    const updates = [
      {
        date: '1/5/25',
        songsApproved: true,
        partialApproval: false
      },
      {
        date: '1/12/25',
        songsApproved: false,
        partialApproval: true
      },
      {
        date: '1/19/25',
        songsApproved: false,
        partialApproval: false
      }
    ];

    for (const update of updates) {
      const result = await collection.updateOne(
        { date: update.date },
        { $set: {
          songsApproved: update.songsApproved,
          partialApproval: update.partialApproval
        }}
      );
      console.log(`Updated ${update.date}:`, result);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

fixPartialApprovals();
const { MongoClient } = require('mongodb');

// Get this from your .env file or MongoDB connection string
const uri = "mongodb+srv://theglow000:Urbane36$@zionsignupsheet.gt7uf.mongodb.net/?retryWrites=true&w=majority&appName=ZionSignupSheet";

async function checkApprovals() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db("church");
    const collection = db.collection("worship_assignments");

    // Find the specific assignments we want to check
    const dates = ['1/5/25', '1/12/25', '1/19/25'];
    const assignments = await collection.find({ 
      date: { $in: dates } 
    }).toArray();

    console.log('Current assignments:', assignments);

    // Update the first service to be approved
    const result = await collection.updateOne(
      { date: '1/5/25' },
      { $set: { songsApproved: true } }
    );

    console.log('Update result:', result);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkApprovals();
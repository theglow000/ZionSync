const { MongoClient } = require('mongodb');

// Get this from your .env file or MongoDB connection string
const uri = "mongodb+srv://theglow000:Urbane36$@zionsignupsheet.gt7uf.mongodb.net/?retryWrites=true&w=majority&appName=ZionSignupSheet";

async function extractAndSaveSongs() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db("church");

        // Get all service songs from the first 4 services
        const serviceSongs = await db.collection("service_songs")
            .find({})
            .sort({ date: 1 })
            .limit(4)
            .toArray();

        const songsToAdd = [];

        // Extract unique songs from the services
        serviceSongs.forEach(service => {
            if (service.selections) {
                Object.values(service.selections).forEach(selection => {
                    if (selection.title) {
                        songsToAdd.push({
                            title: selection.title,
                            type: selection.type || 'hymn',
                            number: selection.number || '',
                            hymnal: selection.hymnal || '',
                            author: selection.author || '',
                            hymnaryLink: selection.type === 'hymn' ? selection.sheetMusic : '',
                            songSelectLink: selection.type === 'contemporary' ? selection.sheetMusic : '',
                            youtubeLink: selection.youtube || '',
                            notes: selection.notes || '',
                            created: new Date(),
                            lastUpdated: new Date()
                        });
                    }
                });
            }
        });

        // Remove duplicates based on title
        const uniqueSongs = songsToAdd.filter((song, index, self) =>
            index === self.findIndex((s) => s.title === song.title)
        );

        console.log('Songs to be added:', uniqueSongs);

        // Add songs to the songs collection
        if (uniqueSongs.length > 0) {
            const result = await db.collection("songs").insertMany(uniqueSongs);
            console.log(`Successfully added ${result.insertedCount} songs`);
        }

        return uniqueSongs;
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

extractAndSaveSongs();
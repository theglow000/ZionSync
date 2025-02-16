const { MongoClient } = require('mongodb');

// Get this from your .env file or MongoDB connection string
const uri = "mongodb+srv://theglow000:Urbane36$@zionsignupsheet.gt7uf.mongodb.net/?retryWrites=true&w=majority&appName=ZionSignupSheet";

async function cleanupSongData() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db("church");

        // Get all service songs
        const serviceSongs = await db.collection("service_songs")
            .find({})
            .toArray();

        console.log(`Found ${serviceSongs.length} services to clean`);

        // Process each service
        for (const service of serviceSongs) {
            const cleanedSelections = {};

            // Only keep song_0, song_1, song_2 and their data
            if (service.selections) {
                for (let i = 0; i < 3; i++) {
                    const key = `song_${i}`;
                    if (service.selections[key]) {
                        cleanedSelections[key] = {
                            type: service.selections[key].type || 'hymn',
                            title: service.selections[key].title || '',
                            number: service.selections[key].number || '',
                            hymnal: service.selections[key].hymnal || '',
                            author: service.selections[key].author || '',
                            sheetMusic: service.selections[key].sheetMusic || '',
                            youtube: service.selections[key].youtube || '',
                            notes: service.selections[key].notes || '',
                            approved: service.selections[key].approved || false
                        };
                    }
                }
            }

            // Update the document with cleaned selections
            await db.collection("service_songs").updateOne(
                { _id: service._id },
                { 
                    $set: { 
                        selections: cleanedSelections,
                        timestamp: service.timestamp || new Date(),
                        updatedBy: service.updatedBy || null
                    }
                }
            );

            console.log(`Cleaned service for date: ${service.date}`);
        }

        console.log('Data cleanup completed successfully');
    } catch (error) {
        console.error('Error cleaning data:', error);
    } finally {
        await client.close();
    }
}

cleanupSongData();
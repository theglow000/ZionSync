import clientPromise from './src/lib/mongodb.js';

async function getSampleDocuments() {
  try {
    const client = await clientPromise;
    const db = client.db('church');
    
    console.log('SERVICE DETAILS SAMPLE:');
    const serviceDetail = await db.collection('serviceDetails').findOne({});
    console.log(JSON.stringify(serviceDetail, null, 2));
    
    console.log('\nSERVICE SONGS SAMPLE:');
    const serviceSong = await db.collection('service_songs').findOne({});
    console.log(JSON.stringify(serviceSong, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

getSampleDocuments();

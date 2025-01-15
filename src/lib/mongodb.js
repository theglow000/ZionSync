import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not defined in environment variables');
  throw new Error('Please add your Mongo URI to environment variables');
}

const uri = process.env.MONGODB_URI;
console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);

const options = {
  connectTimeoutMS: 10000,
  retryWrites: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

let client;
let clientPromise;

try {
  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
} catch (error) {
  console.error('MongoDB connection error:', error);
  throw error;
}

export default clientPromise;
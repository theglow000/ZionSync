/* global use, db */
// MongoDB Playground for ZionSync Church Database Exploration
// Make sure you're connected to your MongoDB instance

// Select the church database
use('church');

// Check what collections exist in the database
const collections = db.getCollectionNames();
console.log("Available collections:", collections);

// Examine structure of serviceDetails collection
const serviceDetail = db.getCollection('serviceDetails').findOne();
console.log("Service Details document structure:", serviceDetail);

// Examine structure of service_songs collection
const serviceSong = db.getCollection('service_songs').findOne();
console.log("Service Songs document structure:", serviceSong);

// Check how many services we have
const serviceCount = db.getCollection('serviceDetails').count();
console.log(`Total number of services: ${serviceCount}`);

// Check date format in a few examples
const dateSamples = db.getCollection('serviceDetails').find({}, {date: 1}).limit(5).toArray();
console.log("Date format samples:", dateSamples);

// Look for any services that might already have liturgical information
const withLiturgical = db.getCollection('serviceDetails').find({liturgical: {$exists: true}}).count();
console.log(`Services with liturgical information: ${withLiturgical}`);
import clientPromise from "./src/lib/mongodb.js";

async function inspectServiceData() {
  try {
    const client = await clientPromise;
    const db = client.db("church");

    // Get a single service detail document
    const serviceDetail = await db.collection("serviceDetails").findOne({});

    console.log("SERVICE DETAILS STRUCTURE:");
    console.log("Keys:", Object.keys(serviceDetail));
    console.log("Has elements array:", Array.isArray(serviceDetail.elements));
    console.log("Element count:", serviceDetail.elements?.length);
    console.log("Sample element:", serviceDetail.elements?.[0]);

    // Get a matching service songs document
    if (serviceDetail?.date) {
      const serviceSong = await db
        .collection("service_songs")
        .findOne({ date: serviceDetail.date });

      console.log("\nMATCHING SERVICE SONGS:");
      console.log("Found matching songs:", !!serviceSong);
      if (serviceSong) {
        console.log("Keys:", Object.keys(serviceSong));
        console.log(
          "Selection keys:",
          Object.keys(serviceSong.selections || {}),
        );
      }
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

inspectServiceData();

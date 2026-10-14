import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getLiturgicalInfo } from "@/lib/LiturgicalCalendarService";
import {
  validateDate,
  serviceLiturgicalSchema,
  createValidationResponse,
} from "@/lib/liturgical-validation";
import { readJsonBody } from "@/lib/apiSchemas";
import {
  applySelectionsToElements,
  SELECTABLE_SONG_TYPE,
} from "@/lib/serviceElements";
import { syncSongUsageForDate } from "@/lib/songUsageSync";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    const client = await clientPromise;
    const db = client.db("church");

    if (date) {
      // Validate date parameter
      try {
        validateDate(date);
      } catch (error) {
        return NextResponse.json(
          createValidationResponse([
            { message: `Invalid date parameter: ${error.message}` },
          ]),
          { status: 400 },
        );
      }

      const selections = await db.collection("service_songs").findOne({ date });

      // If we have selections but no liturgical info, add it
      if (selections && !selections.liturgical) {
        try {
          // Parse date string to Date object (assuming format M/D/YY)
          const [month, day, yearShort] = date
            .split("/")
            .map((num) => parseInt(num, 10));
          // Convert 2-digit year to 4-digit
          const fullYear = yearShort < 50 ? 2000 + yearShort : 1900 + yearShort;
          const serviceDate = new Date(fullYear, month - 1, day);

          // Get liturgical information using our service
          const liturgicalInfo = getLiturgicalInfo(serviceDate);

          // Validate liturgical data before storing
          const liturgicalData = {
            season: liturgicalInfo.seasonId,
            seasonName: liturgicalInfo.season.name,
            color: liturgicalInfo.color,
            specialDay: liturgicalInfo.specialDayId,
          };

          const validatedLiturgical =
            serviceLiturgicalSchema.parse(liturgicalData);

          // Add liturgical information to the selections
          selections.liturgical = validatedLiturgical;

          // Save liturgical info back to database
          await db
            .collection("service_songs")
            .updateOne(
              { date },
              { $set: { liturgical: selections.liturgical } },
            );
        } catch (error) {
          console.error("Error adding liturgical info:", error);
          // Continue without liturgical info rather than failing
        }
      }

      return NextResponse.json(selections || {});
    }

    const selections = await db.collection("service_songs").find({}).toArray();

    // Add liturgical information to all selections
    for (let selection of selections) {
      if (!selection.liturgical) {
        try {
          // Parse date string to Date object (assuming format M/D/YY)
          const [month, day, yearShort] = selection.date
            .split("/")
            .map((num) => parseInt(num, 10));
          // Convert 2-digit year to 4-digit
          const fullYear = yearShort < 50 ? 2000 + yearShort : 1900 + yearShort;
          const serviceDate = new Date(fullYear, month - 1, day);

          // Get liturgical information using our service
          const liturgicalInfo = getLiturgicalInfo(serviceDate);

          // Add liturgical information to the selection
          selection.liturgical = {
            season: liturgicalInfo.seasonId,
            seasonName: liturgicalInfo.season.name,
            color: liturgicalInfo.color,
            specialDay: liturgicalInfo.specialDayId,
          };

          // Save liturgical info back to database
          await db
            .collection("service_songs")
            .updateOne(
              { date: selection.date },
              { $set: { liturgical: selection.liturgical } },
            );
        } catch (error) {
          console.error("Error adding liturgical info to selection:", error);
          // Continue without liturgical info rather than failing
        }
      }
    }

    return NextResponse.json(selections);
  } catch (e) {
    console.error("Error in GET /api/service-songs:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const parsedBody = await readJsonBody(request);
    if (!parsedBody.success) return parsedBody.response;
    const body = parsedBody.data;
    const client = await clientPromise;
    const db = client.db("church");

    // Add liturgical information to new selections
    if (!body.liturgical) {
      // Parse date string to Date object (assuming format M/D/YY)
      const [month, day, yearShort] = body.date
        .split("/")
        .map((num) => parseInt(num, 10));
      // Convert 2-digit year to 4-digit
      const fullYear = yearShort < 50 ? 2000 + yearShort : 1900 + yearShort;
      const serviceDate = new Date(fullYear, month - 1, day);

      // Get liturgical information using our service
      const liturgicalInfo = getLiturgicalInfo(serviceDate);

      // Add liturgical information to the body
      body.liturgical = {
        season: liturgicalInfo.seasonId,
        seasonName: liturgicalInfo.season.name,
        color: liturgicalInfo.color,
        specialDay: liturgicalInfo.specialDayId,
      };
    }

    // Update service_songs collection first
    await db.collection("service_songs").updateOne(
      { date: body.date },
      {
        $set: {
          date: body.date,
          selections: body.selections,
          liturgical: body.liturgical, // Include liturgical info
          updatedBy: body.updatedBy,
          timestamp: new Date(),
        },
      },
      { upsert: true },
    );

    // Then update serviceDetails with the selections - SURGICALLY UPDATE ONLY SONG ELEMENTS
    const serviceDetails = await db
      .collection("serviceDetails")
      .findOne({ date: body.date });

    // Song history follows the selections exactly (adds and swaps alike).
    // Advisory data: a failure here must not fail the save itself.
    try {
      await syncSongUsageForDate(db, body.date, body.selections, {
        service: serviceDetails?.type || "",
        addedBy: body.updatedBy || "",
      });
    } catch (syncError) {
      console.error("Song history sync failed:", syncError);
    }
    if (serviceDetails?.elements) {
      // Map selections onto song lines by slot key (shared with the picker),
      // then write back only the song lines that changed shape
      const mapped = applySelectionsToElements(
        serviceDetails.elements,
        body.selections,
      );
      const songUpdates = mapped
        .map((element, index) => ({ element, index }))
        .filter(({ element }) => element?.type === SELECTABLE_SONG_TYPE)
        .map(({ element, index }) => ({
          index,
          content: element.content,
          selection: element.selection,
        }));

      // SURGICAL UPDATE: Only update specific song elements, preserve all other elements
      if (songUpdates.length > 0) {
        const setOperations = {};
        const unsetOperations = {};

        // Build MongoDB update operations for each song element position
        songUpdates.forEach((update) => {
          setOperations[`elements.${update.index}.content`] = update.content;

          if (update.selection) {
            // Set the selection if it exists
            setOperations[`elements.${update.index}.selection`] =
              update.selection;
          } else {
            // Unset (remove) the selection field if it's null
            unsetOperations[`elements.${update.index}.selection`] = "";
          }
        });

        // Add liturgical info update
        setOperations.liturgical = body.liturgical;

        console.log("Surgical update operations:");
        console.log("  $set:", setOperations);
        if (Object.keys(unsetOperations).length > 0) {
          console.log("  $unset:", unsetOperations);
        }

        // Execute surgical update with both $set and $unset operations
        const updateQuery = { $set: setOperations };
        if (Object.keys(unsetOperations).length > 0) {
          updateQuery.$unset = unsetOperations;
        }

        await db
          .collection("serviceDetails")
          .updateOne({ date: body.date }, updateQuery);

        const clearedCount = Object.keys(unsetOperations).filter((key) =>
          key.includes(".selection"),
        ).length;
        const updatedCount = songUpdates.length - clearedCount;
        console.log(
          `Successfully updated ${updatedCount} song elements and cleared ${clearedCount} selections while preserving all other content`,
        );
      } else {
        // If no song updates, just sync liturgical info
        await db
          .collection("serviceDetails")
          .updateOne(
            { date: body.date },
            { $set: { liturgical: body.liturgical } },
          );
        console.log("No song updates needed, only synced liturgical info");
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error in POST /api/service-songs:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

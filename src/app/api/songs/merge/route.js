import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const { sourceId, targetId } = await request.json();
    
    if (!sourceId || !targetId) {
      return NextResponse.json({ 
        error: 'Source and target song IDs are required' 
      }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db("church");
    
    // Get both songs
    const sourceSong = await db.collection("songs").findOne({ 
      _id: new ObjectId(sourceId) 
    });
    const targetSong = await db.collection("songs").findOne({ 
      _id: new ObjectId(targetId) 
    });
    
    if (!sourceSong || !targetSong) {
      return NextResponse.json({ 
        error: 'One or both songs not found' 
      }, { status: 404 });
    }
    
    // Get usage history for source song
    const sourceUsage = await db.collection("song_usage").findOne({ 
      title: sourceSong.title 
    });
    
    // If source song has usage history, merge it with target song's usage history
    if (sourceUsage) {
      const targetUsage = await db.collection("song_usage").findOne({ 
        title: targetSong.title 
      });
      
      if (targetUsage) {
        // Merge usage histories
        await db.collection("song_usage").updateOne(
          { title: targetSong.title },
          { 
            $push: { 
              uses: { 
                $each: sourceUsage.uses 
              } 
            } 
          }
        );
        
        // Delete the source usage history
        await db.collection("song_usage").deleteOne({ 
          title: sourceSong.title 
        });
      } else {
        // If target song has no usage history, rename source song's usage to target song's title
        await db.collection("song_usage").updateOne(
          { title: sourceSong.title },
          { 
            $set: { 
              title: targetSong.title,
              type: targetSong.type
            } 
          }
        );
      }
    }
    
    // Delete the source song
    await db.collection("songs").deleteOne({ 
      _id: new ObjectId(sourceId) 
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Songs merged successfully' 
    });
    
  } catch (e) {
    console.error('Error merging songs:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

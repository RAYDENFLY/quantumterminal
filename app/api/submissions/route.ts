import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Research from '@/models/Research';
import Learning from '@/models/Learning';
import Academy from '@/models/Academy';
import MarketUpdate from '@/models/MarketUpdate';

export const dynamic = 'force-dynamic';

// GET /api/submissions - Get all submissions across all content types
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const skip = (page - 1) * limit;

    // Build base query
    let baseQuery: any = {};
    
    if (status) {
      baseQuery.status = status;
    }

    if (search) {
      baseQuery.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } }
      ];
    }

    let allSubmissions: any[] = [];

    if (type) {
      // Fetch from specific collection
      let items = [];
      let total = 0;

      switch (type) {
        case 'research':
          total = await Research.countDocuments(baseQuery);
          items = await Research.find(baseQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
          break;
        case 'learning':
          total = await Learning.countDocuments(baseQuery);
          items = await Learning.find(baseQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
          break;
        case 'academy':
          total = await Academy.countDocuments(baseQuery);
          items = await Academy.find(baseQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
          break;
        case 'market-update':
          total = await MarketUpdate.countDocuments(baseQuery);
          items = await MarketUpdate.find(baseQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
          break;
      }

      allSubmissions = items.map(item => ({
        ...item,
        type,
        _id: item._id.toString()
      }));

      return NextResponse.json({
        success: true,
        data: {
          items: allSubmissions,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } else {
      // Fetch from all collections
      const [researchItems, learningItems, academyItems, marketUpdateItems] = await Promise.all([
        Research.find(baseQuery).sort({ createdAt: -1 }).lean(),
        Learning.find(baseQuery).sort({ createdAt: -1 }).lean(),
        Academy.find(baseQuery).sort({ createdAt: -1 }).lean(),
        MarketUpdate.find(baseQuery).sort({ createdAt: -1 }).lean()
      ]);

      // Combine all submissions with type labels
      allSubmissions = [
        ...researchItems.map(item => ({ ...item, type: 'research' })),
        ...learningItems.map(item => ({ ...item, type: 'learning' })),
        ...academyItems.map(item => ({ ...item, type: 'academy' })),
        ...marketUpdateItems.map(item => ({ ...item, type: 'market-update' }))
      ];

      // Sort by creation date (newest first)
      allSubmissions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Apply pagination
      const total = allSubmissions.length;
      const paginatedSubmissions = allSubmissions.slice(skip, skip + limit);

      return NextResponse.json({
        success: true,
        data: {
          items: paginatedSubmissions.map(item => ({
            ...item,
            _id: item._id.toString()
          })),
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    }

  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}

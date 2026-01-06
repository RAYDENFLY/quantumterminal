import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Research from '@/models/Research';
import Learning from '@/models/Learning';
import Academy from '@/models/Academy';
import MarketUpdate from '@/models/MarketUpdate';
import TradingSignal from '@/models/TradingSignal';
import { withAuth } from '@/lib/auth';

// GET /api/admin/dashboard - Get admin dashboard stats and pending items
export const GET = withAuth(async (request: NextRequest) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // research, learning, academy, market-update
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const skip = (page - 1) * limit;

    // Get counts for dashboard stats
    const [
      pendingResearch,
      pendingLearning, 
      pendingAcademy,
      pendingMarketUpdates,
      pendingTradingSignals,
      approvedResearch,
      approvedLearning,
      approvedAcademy,
      approvedMarketUpdates,
      approvedTradingSignals
    ] = await Promise.all([
      Research.countDocuments({ status: 'pending' }),
      Learning.countDocuments({ status: 'pending' }),
      Academy.countDocuments({ status: 'pending' }),
      MarketUpdate.countDocuments({ status: 'pending' }),
      TradingSignal.countDocuments({ status: 'pending' }),
      Research.countDocuments({ status: 'approved' }),
      Learning.countDocuments({ status: 'approved' }),
      Academy.countDocuments({ status: 'approved' }),
      MarketUpdate.countDocuments({ status: 'approved' }),
      TradingSignal.countDocuments({ status: 'approved' })
    ]);

    const stats = {
      pending: {
        research: pendingResearch,
        learning: pendingLearning,
        academy: pendingAcademy,
        marketUpdate: pendingMarketUpdates,
        tradingSignal: pendingTradingSignals,
        total: pendingResearch + pendingLearning + pendingAcademy + pendingMarketUpdates + pendingTradingSignals
      },
      approved: {
        research: approvedResearch,
        learning: approvedLearning,
        academy: approvedAcademy,
        marketUpdate: approvedMarketUpdates,
        tradingSignal: approvedTradingSignals,
        total: approvedResearch + approvedLearning + approvedAcademy + approvedMarketUpdates + approvedTradingSignals
      }
    };

    // Get specific items if type is requested
    let items = [];
    let total = 0;

    if (type) {
      const query = { status };

      switch (type) {
        case 'research':
          total = await Research.countDocuments(query);
          items = await Research.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
          items = items.map(item => ({ ...item, type: 'research' }));
          break;
        case 'learning':
          total = await Learning.countDocuments(query);
          items = await Learning.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
          items = items.map(item => ({ ...item, type: 'learning' }));
          break;
        case 'academy':
          total = await Academy.countDocuments(query);
          items = await Academy.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
          items = items.map(item => ({ ...item, type: 'academy' }));
          break;
        case 'market-update':
          total = await MarketUpdate.countDocuments(query);
          items = await MarketUpdate.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
          items = items.map(item => ({ ...item, type: 'market-update' }));
          break;
        case 'trading-signal':
          total = await TradingSignal.countDocuments(query);
          items = await TradingSignal.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
          items = items.map(item => ({ ...item, type: 'trading-signal' }));
          break;
      }
    } else {
      // Get items from all collections when no specific type is selected
      const query = { status };

      const [researchItems, learningItems, academyItems, marketUpdateItems, tradingSignalItems] = await Promise.all([
        Research.find(query).sort({ createdAt: -1 }).lean(),
        Learning.find(query).sort({ createdAt: -1 }).lean(),
        Academy.find(query).sort({ createdAt: -1 }).lean(),
        MarketUpdate.find(query).sort({ createdAt: -1 }).lean(),
        TradingSignal.find(query).sort({ createdAt: -1 }).lean()
      ]);

      // Combine and sort all items by creation date
      const allItems = [
        ...researchItems.map(item => ({ ...item, type: 'research' })),
        ...learningItems.map(item => ({ ...item, type: 'learning' })),
        ...academyItems.map(item => ({ ...item, type: 'academy' })),
        ...marketUpdateItems.map(item => ({ ...item, type: 'market-update' })),
        ...tradingSignalItems.map(item => ({ ...item, type: 'trading-signal' }))
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      total = allItems.length;
      items = allItems.slice(skip, skip + limit);
    }

    return NextResponse.json({
      success: true,
      data: {
        stats,
        items: items.map(item => ({
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

  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
});

// PATCH /api/admin/dashboard - Approve or reject submissions
export const PATCH = withAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();

    const body = await request.json();
    const { id, type, action, rejectedReason } = body;

    if (!id || !type || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: id, type, action' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Action must be approve or reject' },
        { status: 400 }
      );
    }

    if (action === 'reject' && !rejectedReason) {
      return NextResponse.json(
        { success: false, error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    let Model;
    switch (type) {
      case 'research':
        Model = Research;
        break;
      case 'learning':
        Model = Learning;
        break;
      case 'academy':
        Model = Academy;
        break;
      case 'market-update':
        Model = MarketUpdate;
        break;
      case 'trading-signal':
        Model = TradingSignal;
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid type' },
          { status: 400 }
        );
    }

    const updateData: any = {
      status: action === 'approve' ? 'approved' : 'rejected',
      approvedBy: user.email,
      approvedAt: new Date()
    };

    if (action === 'reject') {
      updateData.rejectedReason = rejectedReason;
    }

    // For market updates, set publish date when approved
    if (type === 'market-update' && action === 'approve') {
      updateData.publishDate = new Date();
    }

    const item = await Model.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: item,
      message: `${type} ${action}d successfully`
    });

  } catch (error) {
    console.error('Error updating submission status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update submission status' },
      { status: 500 }
    );
  }
});

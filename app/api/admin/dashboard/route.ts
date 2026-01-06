import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Research from '@/models/Research';
import Learning from '@/models/Learning';
import Academy from '@/models/Academy';
import MarketUpdate from '@/models/MarketUpdate';
import TradingSignal from '@/models/TradingSignal';
import AuditLog from '@/models/AuditLog';
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

// Helper function to create audit logs
async function createAuditLog(adminId: string, adminEmail: string, action: 'approve' | 'reject' | 'delete', targetType: string, targetId: string, targetTitle: string, reason: string, request: NextRequest) {
  try {
    const auditLog = new AuditLog({
      adminId,
      adminEmail,
      action,
      targetType,
      targetId,
      targetTitle,
      reason,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });
    await auditLog.save();
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

// PATCH /api/admin/dashboard - Approve or reject submissions
export const PATCH = withAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();

    const body = await request.json();
    const { id, type, action, reason, signalStatus } = body;

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

    if (!reason || reason.trim() === '') {
      return NextResponse.json(
        { success: false, error: `Reason is required for ${action} action` },
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
      updateData.rejectedReason = reason;
    }

    // For market updates, set publish date when approved
    if (type === 'market-update' && action === 'approve') {
      updateData.publishDate = new Date();
    }

    // For trading signals, set signalStatus when approved
    if (type === 'trading-signal' && action === 'approve' && signalStatus) {
      updateData.signalStatus = signalStatus;
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

    // Create audit log
    await createAuditLog(
      user.id,
      user.email,
      action as 'approve' | 'reject',
      type === 'trading-signal' ? 'trading-signals' : type, // Map trading-signal to trading-signals
      id,
      item.title || item.headline || 'Untitled',
      reason,
      request
    );

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

// DELETE /api/admin/dashboard - Delete an item
export const DELETE = withAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();

  const { id, type, reason } = await request.json();
  // Backward-compat: some UI parts still send `trading-signal`
  const normalizedType = type === 'trading-signal' ? 'trading-signals' : type;

  if (!id || !normalizedType) {
      return NextResponse.json(
        { success: false, error: 'ID and type are required' },
        { status: 400 }
      );
    }

    if (!reason || reason.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Reason is required for deletion' },
        { status: 400 }
      );
    }

    // Get the appropriate model
    const modelMap: { [key: string]: any } = {
      'research': Research,
      'learning': Learning,
      'academy': Academy,
      'market-update': MarketUpdate,
      'trading-signals': TradingSignal
    };

  const Model = modelMap[normalizedType];
    if (!Model) {
      return NextResponse.json(
    { success: false, error: `Invalid type: ${normalizedType}` },
        { status: 400 }
      );
    }

    // Get item first to capture title for audit log
    const itemToDelete = await Model.findById(id);
    if (!itemToDelete) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    const deletedItem = await Model.findByIdAndDelete(id);

    if (!deletedItem) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    // Create audit log
    await createAuditLog(
      user.id,
      user.email,
      'delete',
  normalizedType,
      id,
      itemToDelete.title || itemToDelete.headline || 'Untitled',
      reason,
      request
    );

    return NextResponse.json({
      success: true,
  message: `${normalizedType} deleted successfully`
    });

  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete item' },
      { status: 500 }
    );
  }
});

// PUT /api/admin/dashboard - Update an item
export const PUT = withAuth(async (request: NextRequest) => {
  try {
    await connectDB();

  const { id, type, title, description, content, author } = await request.json();
  const normalizedType = type === 'trading-signal' ? 'trading-signals' : type;

  if (!id || !normalizedType) {
      return NextResponse.json(
        { success: false, error: 'ID and type are required' },
        { status: 400 }
      );
    }

    // Get the appropriate model
    const modelMap: { [key: string]: any } = {
      'research': Research,
      'learning': Learning,
      'academy': Academy,
      'market-update': MarketUpdate,
      'trading-signals': TradingSignal
    };

  const Model = modelMap[normalizedType];
    if (!Model) {
      return NextResponse.json(
    { success: false, error: `Invalid type: ${normalizedType}` },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) {
      // Handle different description field names
  if (normalizedType === 'learning') {
        updateData.deskripsi = description;
      } else {
        updateData.description = description;
      }
    }
    if (content !== undefined) updateData.content = content;
    if (author !== undefined) updateData.author = author;

    const updatedItem = await Model.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedItem,
  message: `${normalizedType} updated successfully`
    });

  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update item' },
      { status: 500 }
    );
  }
});

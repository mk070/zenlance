import express from 'express';
import Quote from '../models/Quote.js';
import Client from '../models/Client.js';
import authMiddleware from '../middleware/authMiddleware.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Get all quotes for the authenticated user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, clientId, dateFrom, dateTo, search, page = 1, limit = 20 } = req.query;

    const options = {
      status,
      clientId,
      dateFrom,
      dateTo
    };

    let quotes = await Quote.findByUser(req.user.id, options);

    // Apply search filter if provided
    if (search) {
      quotes = quotes.filter(quote => 
        quote.quoteNumber.toLowerCase().includes(search.toLowerCase()) ||
        quote.title.toLowerCase().includes(search.toLowerCase()) ||
        quote.clientName.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = quotes.length;
    const paginatedQuotes = quotes.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedQuotes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching quotes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quotes',
      error: error.message
    });
  }
});

// Get quote statistics
router.get('/statistics', authMiddleware, async (req, res) => {
  try {
    const { dateRange = 30 } = req.query;
    const statistics = await Quote.getQuoteStatistics(req.user.id, parseInt(dateRange));
    
    const formattedStats = {
      byStatus: {},
      totalCount: 0,
      totalValue: 0
    };

    statistics.forEach(stat => {
      formattedStats.byStatus[stat._id] = {
        count: stat.count,
        totalAmount: stat.totalAmount,
        avgAmount: stat.avgAmount
      };
      formattedStats.totalCount += stat.count;
      formattedStats.totalValue += stat.totalAmount;
    });

    res.json({
      success: true,
      data: formattedStats
    });
  } catch (error) {
    logger.error('Error fetching quote statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

// Get expiring quotes
router.get('/expiring', authMiddleware, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const expiringQuotes = await Quote.getExpiringQuotes(req.user.id, parseInt(days));

    res.json({
      success: true,
      data: expiringQuotes
    });
  } catch (error) {
    logger.error('Error fetching expiring quotes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expiring quotes',
      error: error.message
    });
  }
});

// Get a single quote
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const quote = await Quote.findOne({ 
      _id: req.params.id,
      createdBy: req.user.id,
      isActive: true 
    })
    .populate('clientId', 'firstName lastName company email phone address')
    .populate('invoiceId', 'invoiceNumber status total')
    .populate('projectId', 'name status');

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found'
      });
    }

    res.json({
      success: true,
      data: quote
    });
  } catch (error) {
    logger.error('Error fetching quote:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quote',
      error: error.message
    });
  }
});

// Create a new quote
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { clientId, ...quoteData } = req.body;

    // Validate client exists and belongs to user
    const client = await Client.findOne({
      _id: clientId,
      createdBy: req.user.id,
      isActive: true
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Create quote with client information
    const quote = new Quote({
      ...quoteData,
      clientId: client._id,
      clientName: `${client.firstName} ${client.lastName}`,
      clientEmail: client.email,
      clientAddress: client.address,
      createdBy: req.user.id
    });

    await quote.save();

    // Populate the quote before sending response
    await quote.populate('clientId', 'firstName lastName company email phone address');

    res.status(201).json({
      success: true,
      data: quote,
      message: 'Quote created successfully'
    });
  } catch (error) {
    logger.error('Error creating quote:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create quote',
      error: error.message
    });
  }
});

// Update a quote
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const quote = await Quote.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
      isActive: true
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found'
      });
    }

    // Don't allow editing if quote is accepted or rejected
    if (['accepted', 'rejected'].includes(quote.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot edit ${quote.status} quotes`
      });
    }

    // Update quote fields
    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && key !== 'createdBy') {
        quote[key] = req.body[key];
      }
    });

    await quote.save();
    await quote.populate('clientId', 'firstName lastName company email phone address');

    res.json({
      success: true,
      data: quote,
      message: 'Quote updated successfully'
    });
  } catch (error) {
    logger.error('Error updating quote:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update quote',
      error: error.message
    });
  }
});

// Delete a quote
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const quote = await Quote.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
      isActive: true
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found'
      });
    }

    // Soft delete
    quote.isActive = false;
    await quote.save();

    res.json({
      success: true,
      message: 'Quote deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting quote:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete quote',
      error: error.message
    });
  }
});

// Send quote to client
router.post('/:id/send', authMiddleware, async (req, res) => {
  try {
    const { recipients = [] } = req.body;
    
    const quote = await Quote.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
      isActive: true
    }).populate('clientId');

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found'
      });
    }

    // Add client email if not in recipients
    const emailRecipients = recipients.length > 0 ? recipients : [quote.clientEmail];
    
    await quote.markAsSent(emailRecipients);

    // TODO: Send email notification
    // await emailService.sendQuote(quote, emailRecipients);

    res.json({
      success: true,
      data: quote,
      message: 'Quote sent successfully'
    });
  } catch (error) {
    logger.error('Error sending quote:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send quote',
      error: error.message
    });
  }
});

// Mark quote as viewed
router.post('/:id/view', authMiddleware, async (req, res) => {
  try {
    const quote = await Quote.findOne({
      _id: req.params.id,
      isActive: true
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found'
      });
    }

    await quote.markAsViewed();

    res.json({
      success: true,
      data: quote,
      message: 'Quote marked as viewed'
    });
  } catch (error) {
    logger.error('Error marking quote as viewed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark quote as viewed',
      error: error.message
    });
  }
});

// Accept quote
router.post('/:id/accept', authMiddleware, async (req, res) => {
  try {
    const { acceptedBy } = req.body;
    
    const quote = await Quote.findOne({
      _id: req.params.id,
      isActive: true
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found'
      });
    }

    await quote.accept(acceptedBy);

    res.json({
      success: true,
      data: quote,
      message: 'Quote accepted successfully'
    });
  } catch (error) {
    logger.error('Error accepting quote:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept quote',
      error: error.message
    });
  }
});

// Reject quote
router.post('/:id/reject', authMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const quote = await Quote.findOne({
      _id: req.params.id,
      isActive: true
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found'
      });
    }

    await quote.reject(reason);

    res.json({
      success: true,
      data: quote,
      message: 'Quote rejected'
    });
  } catch (error) {
    logger.error('Error rejecting quote:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject quote',
      error: error.message
    });
  }
});

// Convert quote to invoice
router.post('/:id/convert-to-invoice', authMiddleware, async (req, res) => {
  try {
    const quote = await Quote.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
      isActive: true,
      status: 'accepted'
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found or not accepted'
      });
    }

    if (quote.convertedToInvoice) {
      return res.status(400).json({
        success: false,
        message: 'Quote already converted to invoice'
      });
    }

    const invoice = await quote.convertToInvoice();

    res.json({
      success: true,
      data: {
        quote,
        invoice
      },
      message: 'Quote converted to invoice successfully'
    });
  } catch (error) {
    logger.error('Error converting quote to invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to convert quote to invoice',
      error: error.message
    });
  }
});

// Duplicate quote
router.post('/:id/duplicate', authMiddleware, async (req, res) => {
  try {
    const originalQuote = await Quote.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
      isActive: true
    });

    if (!originalQuote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found'
      });
    }

    const duplicatedQuote = originalQuote.duplicate();
    await duplicatedQuote.save();
    await duplicatedQuote.populate('clientId', 'firstName lastName company email phone address');

    res.json({
      success: true,
      data: duplicatedQuote,
      message: 'Quote duplicated successfully'
    });
  } catch (error) {
    logger.error('Error duplicating quote:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to duplicate quote',
      error: error.message
    });
  }
});

export default router;
const { TrustedContact, PreRegisteredVisitor, VisitorLog, User, Notification } = require('../models');
const { validateTOTP } = require('../services/totpService');
const { sendSuccess, sendError, getPagination, getPaginationMeta } = require('../utils/helpers');
const { HTTP_STATUS, VISITOR_TYPES, VERIFICATION_METHODS, VISITOR_STATUS, NOTIFICATION_TYPES } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * @route   POST /api/v1/security/verify-totp
 * @desc    Verify TOTP code (without requiring phone number)
 * @access  Private (Security)
 */
const verifyTOTP = async (req, res, next) => {
  try {
    const { token } = req.body;
    const estateId = req.user.estateId;

    if (!token || !/^\d{6}$/.test(token)) {
      return sendError(
        res,
        'Invalid token format. Must be 6 digits.',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const contacts = await TrustedContact.find({
      estateId,
      totpEnabled: true,
      isActive: true,
    })
      .select('+totpSecret')
      .populate('residentId', 'fullName homeAddress phone acceptingVisitors');

    if (contacts.length === 0) {
      logger.warn(`No active trusted contacts with TOTP in estate: ${estateId}`);
      return sendError(
        res,
        'No trusted contacts with TOTP enabled in this estate',
        HTTP_STATUS.NOT_FOUND
      );
    }

    let validContact = null;
    for (const contact of contacts) {
      if (!contact.totpSecret) {
        logger.warn(`Contact ${contact._id} missing totpSecret`);
        continue;
      }

      const validation = validateTOTP(token, contact.totpSecret);
      
      if (validation.isValid) {
        validContact = contact;
        logger.info(`TOTP matched for contact: ${contact.fullName} (${contact._id})`);
        break;
      }
    }

    if (!validContact) {
      logger.warn(`Failed TOTP verification attempt in estate ${estateId} with token: ${token}`);
      return sendError(
        res,
        'Invalid or expired TOTP code',
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    if (!validContact.residentId.acceptingVisitors) {
      logger.warn(`Resident ${validContact.residentId._id} not accepting visitors`);
      return sendError(
        res,
        'Resident is currently not accepting visitors',
        HTTP_STATUS.FORBIDDEN
      );
    }

    await validContact.recordUsage();
    
    validContact.lastUsedToken = token;
    validContact.lastTokenUsedAt = new Date();
    await validContact.save();

    logger.info(`TOTP verified successfully for ${validContact.fullName} visiting ${validContact.residentId.fullName}`);

    return sendSuccess(res, 'TOTP verified successfully. Visitor can proceed.', {
      valid: true,
      trustedContactId: validContact._id,
      visitorName: validContact.fullName,
      visitorPhone: validContact.phone,
      residentName: validContact.residentId.fullName,
      residentAddress: validContact.residentId.homeAddress,
      residentId: validContact.residentId._id,
    });
  } catch (error) {
    logger.error(`TOTP verification error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * @route   POST /api/v1/security/search-visitor
 * @desc    Search for pre-registered visitor by phone with date validation
 * @access  Private (Security)
 */
const searchVisitor = async (req, res, next) => {
  try {
    const { phone } = req.body;
    const estateId = req.user.estateId;

    if (!phone || phone.trim() === '') {
      return sendError(
        res,
        'Phone number is required',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    logger.info(`🔍 Searching for visitor - Phone: ${phone}, Estate: ${estateId}`);

    const normalizedPhone = phone.replace(/[\s\-\(\)\.]/g, '');
    const phoneVariations = [phone, normalizedPhone, phone.trim()];

    logger.info(`🔍 Phone variations: ${JSON.stringify(phoneVariations)}`);

    const currentDate = new Date();
    
    // Search for valid, pending visitors
    let visitors = await PreRegisteredVisitor.find({
      visitorPhone: { $in: phoneVariations },
      estateId: estateId,
      status: VISITOR_STATUS.PENDING,
      validUntil: { $gte: currentDate },
    }).populate('residentId', 'fullName homeAddress phone email acceptingVisitors');

    logger.info(`🔍 Found ${visitors.length} valid PENDING visitors`);

    if (visitors.length === 0) {
      logger.info(`❌ No pre-registered visitor found with phone: ${phone} in estate: ${estateId}`);
      return sendError(
        res,
        'No pre-registered visitor found with this phone number.',
        HTTP_STATUS.NOT_FOUND
      );
    }

    logger.info(`✅ Found ${visitors.length} visitor(s) for phone: ${phone}`);
    
    // Filter visitors whose residents are accepting visitors
    const availableVisitors = [];
    const unavailableResidents = [];

    for (const visitor of visitors) {
      if (!visitor.residentId) {
        logger.warn(`Visitor ${visitor._id} has no associated resident`);
        continue;
      }

      if (visitor.residentId.acceptingVisitors) {
        availableVisitors.push(visitor);
      } else {
        unavailableResidents.push(visitor.residentId.fullName);
      }
    }

    if (availableVisitors.length === 0) {
      logger.warn(`All residents not accepting visitors for phone: ${phone}`);
      const residentNames = unavailableResidents.join(', ');
      return sendError(
        res,
        unavailableResidents.length > 0 
          ? `${residentNames} ${unavailableResidents.length > 1 ? 'are' : 'is'} currently not accepting visitors.`
          : 'Resident(s) are currently not accepting visitors',
        HTTP_STATUS.FORBIDDEN
      );
    }

    // ✅ NEW: Check date restrictions for each visitor
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const validVisitorsForToday = [];
    const notExpectedToday = [];

    for (const visitor of availableVisitors) {
      const expectedDate = new Date(visitor.expectedArrivalDate);
      expectedDate.setHours(0, 0, 0, 0);
      
      const isToday = today.getTime() === expectedDate.getTime();
      const isBeforeExpectedDate = today < expectedDate;
      
      if (isToday) {
        // It's the expected day - allow entry
        validVisitorsForToday.push(visitor);
      } else if (isBeforeExpectedDate) {
        // Arriving early - check if allowed
        if (visitor.allowEarlyArrival) {
          validVisitorsForToday.push(visitor);
          logger.info(`✅ Early arrival allowed for ${visitor.visitorName}`);
        } else {
          notExpectedToday.push({
            visitorName: visitor.visitorName,
            expectedDate: expectedDate,
            residentName: visitor.residentId.fullName,
          });
          logger.warn(`⚠️ Early arrival NOT allowed for ${visitor.visitorName}`);
        }
      }
      // If after expected date, it's expired (already handled by validUntil check)
    }

    // If no valid visitors for today
    if (validVisitorsForToday.length === 0 && notExpectedToday.length > 0) {
      const visitorInfo = notExpectedToday[0];
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'];
      const expectedDateStr = `${months[visitorInfo.expectedDate.getMonth()]} ${visitorInfo.expectedDate.getDate()}, ${visitorInfo.expectedDate.getFullYear()}`;
      
      logger.warn(`Visitor ${visitorInfo.visitorName} arrived early but not allowed. Expected: ${expectedDateStr}`);
      
      return sendError(
        res,
        `The resident ${visitorInfo.residentName} is not expecting this visitor today. Expected arrival date is ${expectedDateStr}.`,
        HTTP_STATUS.FORBIDDEN
      );
    }

    if (validVisitorsForToday.length === 0) {
      logger.info(`No valid visitors for today with phone: ${phone}`);
      return sendError(
        res,
        'No pre-registered visitor found with this phone number.',
        HTTP_STATUS.NOT_FOUND
      );
    }

    logger.info(`✅ Visitor search successful - ${validVisitorsForToday.length} available`);

    // Return only valid visitors for today
    return sendSuccess(res, 'Pre-registered visitor(s) found', {
      visitors: validVisitorsForToday.map(v => ({
        id: v._id,
        visitorName: v.visitorName,
        visitorPhone: v.visitorPhone,
        carPlateNumber: v.carPlateNumber,
        numberOfPeople: v.numberOfPeople,
        complexion: v.complexion,
        purpose: v.purpose,
        expectedArrivalDate: v.expectedArrivalDate,
        validUntil: v.validUntil,
        additionalNotes: v.additionalNotes,
        status: v.status,
        allowEarlyArrival: v.allowEarlyArrival,  // ✅ NEW FIELD
        resident: {
          id: v.residentId._id,
          fullName: v.residentId.fullName,
          homeAddress: v.residentId.homeAddress,
          phone: v.residentId.phone,
          acceptingVisitors: v.residentId.acceptingVisitors,
        },
      })),
      verificationMethod: VERIFICATION_METHODS.PRE_REGISTRATION,
    });
  } catch (error) {
    logger.error(`Search visitor error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * @route   POST /api/v1/security/log-entry
 * @desc    Log visitor entry and send notification to resident
 * @access  Private (Security)
 */
const logEntry = async (req, res, next) => {
  try {
    const {
      visitorType,
      trustedContactId,
      preRegisteredVisitorId,
      visitorName,
      visitorPhone,
      carPlateNumber,
      numberOfPeople,
      verificationMethod,
      totpUsed,
      notes,
    } = req.body;

    const estateId = req.user.estateId;
    let residentId;

    if (visitorType === VISITOR_TYPES.TRUSTED && trustedContactId) {
      const contact = await TrustedContact.findById(trustedContactId);
      if (!contact) {
        return sendError(res, 'Trusted contact not found', HTTP_STATUS.NOT_FOUND);
      }
      residentId = contact.residentId;
    } else if (visitorType === VISITOR_TYPES.PRE_REGISTERED && preRegisteredVisitorId) {
      const visitor = await PreRegisteredVisitor.findById(preRegisteredVisitorId);
      if (!visitor) {
        return sendError(res, 'Pre-registered visitor not found', HTTP_STATUS.NOT_FOUND);
      }
      residentId = visitor.residentId;
      
      await visitor.markAsVerified(req.user._id);
    } else {
      return sendError(res, 'Invalid visitor type or missing IDs', HTTP_STATUS.BAD_REQUEST);
    }

    const verifiedById = req.user._id;
    
    const log = await VisitorLog.create({
      estateId,
      residentId,
      visitorType,
      trustedContactId: trustedContactId || undefined,
      preRegisteredVisitorId: preRegisteredVisitorId || undefined,
      visitorName,
      visitorPhone,
      carPlateNumber,
      numberOfPeople: numberOfPeople || 1,
      verificationMethod,
      totpUsed: totpUsed || undefined,
      verifiedBy: verifiedById,
      notes,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    const resident = await User.findById(residentId);
    await Notification.create({
      userId: residentId,
      estateId,
      type: NOTIFICATION_TYPES.VISITOR_ARRIVAL,
      title: 'Visitor Arrival',
      message: `${visitorName} has been granted access and is on their way to your house`,
      channels: ['in_app'],
      relatedVisitorLog: log._id,
      data: {
        visitorName,
        visitorPhone,
        verificationMethod,
        entryTime: log.entryTime,
      },
    });

    logger.info(`Visitor entry logged: ${visitorName} visiting ${resident.fullName}`);

    return sendSuccess(
      res,
      'Entry logged successfully. Resident has been notified.',
      {
        log: {
          id: log._id,
          visitorName: log.visitorName,
          entryTime: log.entryTime,
          residentName: resident.fullName,
          residentAddress: resident.homeAddress,
        },
      },
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    logger.error(`Log entry error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * @route   PUT /api/v1/security/log-exit/:logId
 * @desc    Log visitor exit
 * @access  Private (Security)
 */
const logExit = async (req, res, next) => {
  try {
    const { logId } = req.params;
    const estateId = req.user.estateId;

    const log = await VisitorLog.findOne({
      _id: logId,
      estateId,
    });

    if (!log) {
      return sendError(res, 'Visitor log not found', HTTP_STATUS.NOT_FOUND);
    }

    if (log.exitTime) {
      return sendError(res, 'Exit already logged for this visitor', HTTP_STATUS.BAD_REQUEST);
    }

    await log.logExit();

    logger.info(`Visitor exit logged: ${log.visitorName}`);

    return sendSuccess(res, 'Exit logged successfully', {
      log: {
        id: log._id,
        visitorName: log.visitorName,
        entryTime: log.entryTime,
        exitTime: log.exitTime,
        visitDuration: log.visitDuration,
      },
    });
  } catch (error) {
    logger.error(`Log exit error: ${error.message}`);
    next(error);
  }
};

/**
 * @route   GET /api/v1/security/recent-entries
 * @desc    Get recent visitor entries
 * @access  Private (Security)
 */
const getRecentEntries = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { skip, limit: pageLimit } = getPagination(page, limit);
    const estateId = req.user.estateId;

    const entries = await VisitorLog.find({ estateId })
      .populate('residentId', 'fullName homeAddress phone email')
      .populate('trustedContactId', 'fullName relationship phone')
      .populate('preRegisteredVisitorId', 'purpose visitorName')
      .populate('verifiedBy', 'fullName username')
      .sort({ entryTime: -1 })
      .skip(skip)
      .limit(pageLimit);

    const totalEntries = await VisitorLog.countDocuments({ estateId });
    const pagination = getPaginationMeta(totalEntries, page, pageLimit);

    const formattedEntries = entries.map(entry => ({
      id: entry._id,
      visitorName: entry.visitorName,
      visitorPhone: entry.visitorPhone,
      visitorType: entry.visitorType,
      verificationMethod: entry.verificationMethod,
      carPlateNumber: entry.carPlateNumber,
      numberOfPeople: entry.numberOfPeople,
      entryTime: entry.entryTime,
      exitTime: entry.exitTime,
      visitDuration: entry.visitDuration,
      notes: entry.notes,
      resident: entry.residentId ? {
        id: entry.residentId._id,
        fullName: entry.residentId.fullName,
        homeAddress: entry.residentId.homeAddress,
        phone: entry.residentId.phone,
      } : null,
      trustedContact: entry.trustedContactId ? {
        fullName: entry.trustedContactId.fullName,
        relationship: entry.trustedContactId.relationship,
      } : null,
      preRegisteredVisitor: entry.preRegisteredVisitorId ? {
        purpose: entry.preRegisteredVisitorId.purpose,
      } : null,
      verifiedBy: entry.verifiedBy ? {
        fullName: entry.verifiedBy.fullName || entry.verifiedBy.username,
      } : null,
    }));

    return sendSuccess(res, 'Recent entries retrieved successfully', {
      entries: formattedEntries,
      pagination,
    });
  } catch (error) {
    logger.error(`Get recent entries error: ${error.message}`);
    next(error);
  }
};

/**
 * @route   GET /api/v1/security/current-visitors
 * @desc    Get visitors currently on premises
 * @access  Private (Security)
 */
const getCurrentVisitors = async (req, res, next) => {
  try {
    const estateId = req.user.estateId;

    const visitors = await VisitorLog.getCurrentVisitors(estateId);

    return sendSuccess(res, 'Current visitors retrieved successfully', {
      visitors,
      count: visitors.length,
    });
  } catch (error) {
    logger.error(`Get current visitors error: ${error.message}`);
    next(error);
  }
};

/**
 * @route   GET /api/v1/security/stats
 * @desc    Get security dashboard statistics
 * @access  Private (Security)
 */
const getStats = async (req, res, next) => {
  try {
    const estateId = req.user.estateId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEntries = await VisitorLog.countDocuments({
      estateId,
      entryTime: { $gte: today },
    });

    const todayExits = await VisitorLog.countDocuments({
      estateId,
      exitTime: { $gte: today },
    });

    const currentVisitors = await VisitorLog.countDocuments({
      estateId,
      exitTime: null,
    });

    const totpVerified = await VisitorLog.countDocuments({
      estateId,
      verificationMethod: VERIFICATION_METHODS.TOTP,
      entryTime: { $gte: today },
    });

    return sendSuccess(res, 'Statistics retrieved successfully', {
      todayEntries,
      todayExits,
      currentVisitors,
      totpVerified,
    });
  } catch (error) {
    logger.error(`Get stats error: ${error.message}`);
    next(error);
  }
};

/**
 * @route   GET /api/v1/security/statistics
 * @desc    Get comprehensive statistics
 * @access  Private (Security)
 */
const getStatistics = async (req, res, next) => {
  try {
    const { range = 'all' } = req.query;
    const estateId = req.user.estateId;

    let startDate = new Date('2000-01-01');
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    switch (range) {
      case 'today':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case '7days':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case '30days':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'all':
      default:
        startDate = new Date('2000-01-01');
        break;
    }

    const logs = await VisitorLog.find({
      estateId,
      entryTime: { $gte: startDate, $lte: endDate }
    }).populate('residentId', 'fullName homeAddress');

    const totalVisits = logs.length;
    const uniqueVisitors = new Set(logs.map(log => log.visitorPhone)).size;
    
    const completedVisits = logs.filter(log => log.exitTime);
    const totalDuration = completedVisits.reduce((sum, log) => {
      const duration = (new Date(log.exitTime) - new Date(log.entryTime)) / 60000;
      return sum + duration;
    }, 0);
    const averageVisitDuration = completedVisits.length > 0 
      ? Math.round(totalDuration / completedVisits.length) 
      : 0;

    const currentlyOnPremises = logs.filter(log => !log.exitTime).length;

    const visitorTypes = {
      trusted: logs.filter(log => log.visitorType === 'trusted').length,
      preRegistered: logs.filter(log => log.visitorType === 'pre-registered').length,
      walkIn: logs.filter(log => log.visitorType === 'walk-in').length,
    };

    const verificationMethods = {
      totp: logs.filter(log => log.verificationMethod === 'totp').length,
      preRegistration: logs.filter(log => log.verificationMethod === 'pre-registration').length,
      manual: logs.filter(log => log.verificationMethod === 'manual').length,
    };

    const hourlyDistribution = {};
    for (let i = 0; i < 24; i++) {
      hourlyDistribution[i] = 0;
    }

    logs.forEach(log => {
      const hour = new Date(log.entryTime).getHours();
      hourlyDistribution[hour]++;
    });

    const peakHours = Object.entries(hourlyDistribution)
      .filter(([hour]) => parseInt(hour) >= 6 && parseInt(hour) <= 22)
      .map(([hour, count]) => ({
        hour: `${String(hour).padStart(2, '0')}:00`,
        count
      }));

    const dailyTrend = [];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const dayLogs = logs.filter(log => {
        const logDate = new Date(log.entryTime);
        return logDate >= date && logDate < nextDay;
      });
      
      dailyTrend.push({
        day: daysOfWeek[date.getDay()],
        date: date.toISOString().split('T')[0],
        visits: dayLogs.length
      });
    }

    const residentVisitCount = {};
    
    logs.forEach(log => {
      if (log.residentId) {
        const residentId = log.residentId._id.toString();
        if (!residentVisitCount[residentId]) {
          residentVisitCount[residentId] = {
            name: log.residentId.fullName,
            address: log.residentId.homeAddress,
            visits: 0
          };
        }
        residentVisitCount[residentId].visits++;
      }
    });

    const topResidents = Object.values(residentVisitCount)
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 5);

    const monthlyTrend = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.getMonth();
      const year = date.getFullYear();
      
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
      
      const monthLogs = logs.filter(log => {
        const logDate = new Date(log.entryTime);
        return logDate >= monthStart && logDate <= monthEnd;
      });
      
      monthlyTrend.push({
        month: monthNames[month],
        year: year,
        visits: monthLogs.length
      });
    }

    const dayOfWeekCount = {
      0: { day: 'Sunday', visits: 0 },
      1: { day: 'Monday', visits: 0 },
      2: { day: 'Tuesday', visits: 0 },
      3: { day: 'Wednesday', visits: 0 },
      4: { day: 'Thursday', visits: 0 },
      5: { day: 'Friday', visits: 0 },
      6: { day: 'Saturday', visits: 0 }
    };

    logs.forEach(log => {
      const dayOfWeek = new Date(log.entryTime).getDay();
      dayOfWeekCount[dayOfWeek].visits++;
    });

    const weekdayDistribution = Object.values(dayOfWeekCount);

    let previousStartDate, previousEndDate;
    const currentPeriodDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    previousEndDate = new Date(startDate);
    previousEndDate.setDate(previousEndDate.getDate() - 1);
    previousEndDate.setHours(23, 59, 59, 999);
    
    previousStartDate = new Date(previousEndDate);
    previousStartDate.setDate(previousStartDate.getDate() - currentPeriodDays);
    previousStartDate.setHours(0, 0, 0, 0);

    const previousLogs = await VisitorLog.find({
      estateId,
      entryTime: { $gte: previousStartDate, $lte: previousEndDate }
    });

    const previousVisits = previousLogs.length;
    const previousUniqueVisitors = new Set(previousLogs.map(log => log.visitorPhone)).size;

    const visitsChange = previousVisits > 0 
      ? ((totalVisits - previousVisits) / previousVisits * 100).toFixed(1)
      : 0;
    
    const visitorsChange = previousUniqueVisitors > 0
      ? ((uniqueVisitors - previousUniqueVisitors) / previousUniqueVisitors * 100).toFixed(1)
      : 0;

    const daysInRange = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
    const averageVisitsPerDay = (totalVisits / daysInRange).toFixed(1);

    const statistics = {
      overview: {
        totalVisits,
        totalVisitors: uniqueVisitors,
        averageVisitDuration,
        currentlyOnPremises,
        averageVisitsPerDay: parseFloat(averageVisitsPerDay),
        growthMetrics: {
          visitsChange: parseFloat(visitsChange),
          visitorsChange: parseFloat(visitorsChange)
        }
      },
      visitorTypes,
      verificationMethods,
      peakHours,
      dailyTrend,
      monthlyTrend,
      weekdayDistribution,
      topResidents,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        range
      }
    };

    return sendSuccess(res, 'Statistics retrieved successfully', statistics);

  } catch (error) {
    logger.error(`Get statistics error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

module.exports = {
  verifyTOTP,
  searchVisitor,
  logEntry,
  logExit,
  getRecentEntries,
  getCurrentVisitors,
  getStats,
  getStatistics,
};
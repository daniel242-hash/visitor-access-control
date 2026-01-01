module.exports = {
  // User Roles
  ROLES: {
    ADMIN: 'admin',
    SECURITY: 'security',
    RESIDENT: 'resident',
  },

  // Visitor Types
  VISITOR_TYPES: {
    TRUSTED: 'trusted',
    PRE_REGISTERED: 'pre-registered',
    WALK_IN: 'walk-in',
  },

  // Visitor Status
  VISITOR_STATUS: {
    PENDING: 'pending',
    VERIFIED: 'verified',
    DENIED: 'denied',
    EXPIRED: 'expired',
  },

  // Verification Methods
  VERIFICATION_METHODS: {
    TOTP: 'totp',
    PRE_REGISTRATION: 'pre-registration',
    MANUAL: 'manual',
  },

  // Notification Types
  NOTIFICATION_TYPES: {
    VISITOR_ARRIVAL: 'visitor_arrival',
    TOTP_USED: 'totp_used',
    ACCOUNT_ALERT: 'account_alert',
    SYSTEM_ALERT: 'system_alert',
  },

  // Notification Channels
  NOTIFICATION_CHANNELS: {
    EMAIL: 'email',
    SMS: 'sms',
    IN_APP: 'in_app',  // Changed from 'in-app' to 'in_app'
  },

  // Relationship Types
  RELATIONSHIP_TYPES: [
    'Family',
    'Friend',
    'Worker',
    'Driver',
    'Delivery Person',
    'Service Provider',
    'Other',
  ],

  // Complexion Options
  COMPLEXION_OPTIONS: [
    'Fair',
    'Light',
    'Medium',
    'Dark',
  ],

  // Visit Purposes
  VISIT_PURPOSES: [
    'Personal Visit',
    'Delivery',
    'Service/Repair',
    'Business',
    'Event',
    'Other',
  ],

  // Estate Code Format
  ESTATE_CODE_PREFIX: 'EST',
  ESTATE_CODE_LENGTH: 8, // e.g., EST-12345

  // Pagination Defaults
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // TOTP Settings
  TOTP_ISSUER: 'Visitor Access Control',
  TOTP_ALGORITHM: 'sha1',
  TOTP_DIGITS: 6,

  // Token Expiry
  VERIFICATION_TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
  PASSWORD_RESET_EXPIRY: 1 * 60 * 60 * 1000, // 1 hour

  // HTTP Status Codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
  },
};
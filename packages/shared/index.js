// ─── Shared Package Index ───
// Export tất cả shared utilities, middlewares, và event infrastructure

// Utils
export { default as ApiError } from './src/utils/ApiError.js';
export { default as logger } from './src/utils/logger.js';
export { formatSpecificDate, getFriendlyTime } from './src/utils/timeHelper.js';
export { validateEmail, validatePassword, validateUsername } from './src/utils/validators.js';
export { generateAccessToken, generateRefreshToken } from './src/utils/generateToken.js';
export { default as sendEmail } from './src/utils/sendEmail.js';
export { default as renderEmailTemplate } from './src/utils/emailTemplate.js';

// Middlewares
export { authenticateToken, authorizeRoles, requireInternalService } from './src/middlewares/authMiddleware.js';
export { default as errorHandler } from './src/middlewares/errorHandler.js';

// Events
export { default as EventBus } from './src/events/eventBus.js';
export { EventTypes } from './src/events/eventTypes.js';

// HTTP
export { createServiceClient } from './src/http/serviceClient.js';

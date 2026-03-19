// src/config/swagger.js - Cấu hình Swagger API Documentation
import swaggerJsdoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'LingoSwap API',
    version: '1.0.0',
    description: 'API Documentation cho LingoSwap - Nền tảng trao đổi ngôn ngữ trực tuyến',
    contact: {
      name: 'LingoSwap Team',
      email: 'support@lingoswap.com',
    },
  },
  servers: [
    {
      url: `http://localhost:${process.env.PORT || 5000}`,
      description: 'Development Server',
    },
    {
      url: 'https://api.lingoswap.com',
      description: 'Production Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};

const options = {
  definition: swaggerDefinition,
  apis: ['./src/routes/*.js'], // Đường dẫn đến các file routes có JSDoc
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;

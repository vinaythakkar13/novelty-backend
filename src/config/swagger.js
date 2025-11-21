import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

/**
 * Swagger Configuration
 * This configuration automatically generates API documentation from JSDoc comments
 * in route files and controllers
 */
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'My Express API Documentation',
      version: '1.0.0',
      description: 'A comprehensive REST API built with Express.js and MySQL',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local development server',
      },
      {
        url: 'http://192.168.20.174:5000',
        description: 'Network access (LAN)',
      },
      {
        url: 'https://api.production.com',
        description: 'Production server',
      },
    ],
    components: {
      schemas: {
        User: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            id: {
              type: 'integer',
              description: 'The auto-generated id of the user',
              example: 1,
            },
            name: {
              type: 'string',
              description: 'The name of the user',
              example: 'John Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'The email of the user',
              example: 'john.doe@example.com',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'The date the user was created',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              description: 'Error message',
              example: 'An error occurred',
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              description: 'Success message',
            },
            data: {
              type: 'object',
              description: 'Response data',
            },
          },
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  // Path to the API routes files with JSDoc comments
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js',
    './src/app.js',
  ],
};

// Generate Swagger specification
const swaggerSpec = swaggerJsdoc(options);

/**
 * Setup Swagger middleware
 * @param {Object} app - Express application instance
 */
export const setupSwagger = (app) => {
  // Serve Swagger UI at /api-docs
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'My Express API Docs',
  }));

  // Serve raw Swagger JSON specification at /api-docs.json
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('📚 Swagger UI initialized successfully');
};

export default swaggerSpec;


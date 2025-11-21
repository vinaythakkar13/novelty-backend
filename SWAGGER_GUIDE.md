# Swagger API Documentation Guide

## Overview
This application now includes automatic API documentation using Swagger (OpenAPI 3.0). The documentation is automatically generated from JSDoc comments in your route files.

## Accessing the Documentation

Once the server is running, you can access the Swagger UI at:
- **Swagger UI**: http://localhost:5000/api-docs
- **Swagger JSON**: http://localhost:5000/api-docs.json

## Features

### ✅ Automatic API Discovery
All routes with proper JSDoc annotations are automatically discovered and documented.

### ✅ Interactive Testing
The Swagger UI provides an interactive interface where you can:
- View all available endpoints
- See request/response schemas
- Test APIs directly from the browser
- View example requests and responses

### ✅ OpenAPI 3.0 Compliant
The documentation follows the OpenAPI 3.0 specification, making it compatible with various API tools.

## How to Document New APIs

When you add a new route, simply add JSDoc comments above the route definition:

### Example: Documenting a GET endpoint

```javascript
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a specific user by their ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User found successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/:id', getUserById);
```

### Example: Documenting a POST endpoint with request body

```javascript
/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/', createUser);
```

### Example: Documenting endpoints with authentication

```javascript
/**
 * @swagger
 * /api/protected-route:
 *   get:
 *     summary: Protected endpoint
 *     tags: [Protected]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 */
router.get('/protected-route', authMiddleware, protectedHandler);
```

## Defining Reusable Schemas

You can define reusable schemas in the `src/config/swagger.js` file under `components.schemas`:

```javascript
components: {
  schemas: {
    User: {
      type: 'object',
      properties: {
        id: { type: 'integer', example: 1 },
        name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', format: 'email', example: 'john@example.com' }
      }
    }
  }
}
```

Then reference them in your routes:

```javascript
$ref: '#/components/schemas/User'
```

## Configuration

The Swagger configuration is located in `src/config/swagger.js`. You can customize:

- API title and description
- Server URLs
- Contact information
- Security schemes
- Custom CSS for Swagger UI
- API file paths to scan

## Best Practices

1. **Always use tags**: Group related endpoints with tags for better organization
2. **Provide examples**: Include example values for better clarity
3. **Document all responses**: Include success and error responses
4. **Use schema references**: Define reusable schemas to avoid duplication
5. **Add descriptions**: Help users understand what each endpoint does
6. **Document parameters**: Clearly specify all required and optional parameters

## Tags Used in This Application

- **Users**: User management endpoints
- **Admin**: Admin authentication and management
- **Health**: System health checks

## Swagger JSDoc Syntax Quick Reference

### Basic Structure
```javascript
/**
 * @swagger
 * /path:
 *   method:
 *     summary: Brief description
 *     description: Detailed description
 *     tags: [TagName]
 *     responses:
 *       200:
 *         description: Success response
 */
```

### Parameter Types
- `in: path` - URL path parameters
- `in: query` - Query string parameters
- `in: header` - Header parameters
- `in: cookie` - Cookie parameters

### Common Response Codes
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Troubleshooting

### Documentation not updating?
Restart the server to regenerate the Swagger specification.

### Route not showing up?
Make sure:
1. The file is included in the `apis` array in `swagger.js`
2. The JSDoc comment follows the correct syntax
3. The route is properly registered in your Express app

### Custom schemas not working?
Verify that:
1. The schema is defined in `components.schemas` in `swagger.js`
2. You're using the correct reference format: `$ref: '#/components/schemas/SchemaName'`

## Additional Resources

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger JSDoc Documentation](https://github.com/Surnet/swagger-jsdoc)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)

---

**Happy Documenting! 📚**


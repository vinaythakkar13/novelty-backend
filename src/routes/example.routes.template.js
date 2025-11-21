/**
 * TEMPLATE FILE: How to create documented API routes
 * 
 * This file serves as a reference for creating new API routes with automatic
 * Swagger documentation. Copy this pattern when adding new endpoints.
 * 
 * DO NOT import this file - it's a template only!
 */

import express from 'express';
import { exampleController } from '../controllers/exampleController.js';

const router = express.Router();

// ============================================================================
// EXAMPLE 1: Simple GET endpoint with path parameter
// ============================================================================

/**
 * @swagger
 * /api/example/{id}:
 *   get:
 *     summary: Get item by ID
 *     description: Retrieve a specific item using its unique identifier
 *     tags: [Example]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Unique identifier of the item
 *         example: 1
 *     responses:
 *       200:
 *         description: Item retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: Example Item
 *       404:
 *         description: Item not found
 *       500:
 *         description: Server error
 */
router.get('/:id', exampleController.getById);

// ============================================================================
// EXAMPLE 2: GET endpoint with query parameters
// ============================================================================

/**
 * @swagger
 * /api/example:
 *   get:
 *     summary: Get all items with filters
 *     description: Retrieve a list of items with optional filtering and pagination
 *     tags: [Example]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term to filter results
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 */
router.get('/', exampleController.getAll);

// ============================================================================
// EXAMPLE 3: POST endpoint with request body validation
// ============================================================================

/**
 * @swagger
 * /api/example:
 *   post:
 *     summary: Create a new item
 *     description: Add a new item to the database with validation
 *     tags: [Example]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 description: Name of the item
 *                 example: Sample Item
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Contact email
 *                 example: example@domain.com
 *               category:
 *                 type: string
 *                 enum: [type1, type2, type3]
 *                 description: Item category
 *                 example: type1
 *               description:
 *                 type: string
 *                 description: Optional description
 *                 example: This is an optional field
 *               active:
 *                 type: boolean
 *                 default: true
 *                 description: Whether the item is active
 *     responses:
 *       201:
 *         description: Item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Item created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 123
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
router.post('/', exampleController.create);

// ============================================================================
// EXAMPLE 4: PUT endpoint for updates
// ============================================================================

/**
 * @swagger
 * /api/example/{id}:
 *   put:
 *     summary: Update an existing item
 *     description: Update item details by ID
 *     tags: [Example]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Item ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Name
 *               description:
 *                 type: string
 *                 example: Updated description
 *     responses:
 *       200:
 *         description: Item updated successfully
 *       404:
 *         description: Item not found
 *       400:
 *         description: Invalid input
 */
router.put('/:id', exampleController.update);

// ============================================================================
// EXAMPLE 5: DELETE endpoint
// ============================================================================

/**
 * @swagger
 * /api/example/{id}:
 *   delete:
 *     summary: Delete an item
 *     description: Remove an item from the database
 *     tags: [Example]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Item ID to delete
 *     responses:
 *       200:
 *         description: Item deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Item deleted successfully
 *       404:
 *         description: Item not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', exampleController.delete);

// ============================================================================
// EXAMPLE 6: Protected endpoint with authentication
// ============================================================================

/**
 * @swagger
 * /api/example/protected:
 *   get:
 *     summary: Protected endpoint (requires authentication)
 *     description: Access protected resource with JWT token
 *     tags: [Example]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Access granted
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get('/protected', authMiddleware, exampleController.protected);

// ============================================================================
// EXAMPLE 7: File upload endpoint
// ============================================================================

/**
 * @swagger
 * /api/example/upload:
 *   post:
 *     summary: Upload a file
 *     description: Upload an image or document
 *     tags: [Example]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload
 *               description:
 *                 type: string
 *                 description: Optional file description
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *       400:
 *         description: Invalid file or missing file
 */
router.post('/upload', uploadMiddleware, exampleController.upload);

export default router;

/**
 * KEY POINTS:
 * 
 * 1. Always start with @swagger tag
 * 2. Specify the full path including /api prefix
 * 3. Use tags to group related endpoints
 * 4. Document all parameters (path, query, body)
 * 5. Include all possible response codes
 * 6. Provide examples for better UX
 * 7. Use $ref to reference schemas from swagger.js
 * 8. For authentication, use security: [{ bearerAuth: [] }]
 * 9. Restart server after changes to see updates
 */


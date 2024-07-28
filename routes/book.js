const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const mongoose = require('mongoose');
const Book = require('../models/Book');
const authMiddleware = require('../middleware/auth');
const router = express.Router();


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

/**
 * @swagger
 * tags:
 *   name: Books
 *   description: Book management
 */

/**
 * @swagger
 * /api/books:
 *   post:
 *     summary: Create a new book
 *     tags: [Books]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               author:
 *                 type: string
 *               coverPage:
 *                 type: string
 *                 format: binary
 *               year:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Book created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */

// Create a new book (Admin and Author)
router.post(
    '/',
    authMiddleware(['Admin', 'Author']),
    upload.single('coverPage'),
    [
        body('title').notEmpty().withMessage('Title is required'),
        body('author').notEmpty().withMessage('Author is required'),
        body('year').isNumeric().withMessage('Year must be a number')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, author, year } = req.body;
        const coverPage = req.file ? req.file.path : null;

        try {
            const book = new Book({ title, author, coverPage, year });
            await book.save();
            res.status(201).json({ message: 'Book created successfully', book });
        } catch (error) {
            res.status(500).json({ error: 'Server error' });
        }
    }
);

/**
 * @swagger
 * /api/books:
 *   get:
 *     summary: Get all books
 *     tags: [Books]
 *     responses:
 *       200:
 *         description: A list of books
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Book'
 *       500:
 *         description: Server error
 */

// Get all books (All users)
router.get('/', authMiddleware(['Admin', 'Author', 'Reader']), async (req, res) => {
    try {
        const books = await Book.find();
        res.json(books);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/books/{id}:
 *   put:
 *     summary: Update a book
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Book ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               author:
 *                 type: string
 *               coverPage:
 *                 type: string
 *               year:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Book updated successfully
 *       404:
 *         description: Book not found
 *       500:
 *         description: Server error
 */

// Update a book (Admin and Author)
router.put(
    '/:id',
    authMiddleware(['Admin', 'Author']),
    upload.single('coverPage'), // Multer middleware to handle coverPage file upload
    [
      body('title').optional().notEmpty().withMessage('Title is required'),
      body('author').optional().notEmpty().withMessage('Author is required'),
      body('year').optional().isNumeric().withMessage('Year must be a number'),
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      const { title, author, year } = req.body;
  
      try {
        const book = await Book.findById(req.params.id);
  
        if (!book) {
          return res.status(404).json({ error: 'Book not found' });
        }
  
        
        book.title = title || book.title;
        book.author = author || book.author;
        book.year = year || book.year;
  
       
        if (req.file) {
          book.coverPage = req.file.path; 
        }
  
        await book.save(); 
        res.json({ message: 'Book updated successfully', book });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
      }
    }
  );

/**
 * @swagger
 * /api/books/{id}:
 *   delete:
 *     summary: Delete a book
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Book ID
 *     responses:
 *       200:
 *         description: Book deleted successfully
 *       404:
 *         description: Book not found
 *       500:
 *         description: Server error
 */

// Delete a book (Admin only)
router.delete('/:id', authMiddleware(['Admin']), async (req, res) => {
    try {
        
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid book ID' });
        }

        
        const book = await Book.findById(req.params.id);

        
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }

        
        await Book.deleteOne({ _id: req.params.id });

        res.json({ message: 'Book deleted successfully' });
    } catch (error) {
        console.error('Error deleting book:', error); // Log the error for debugging
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;

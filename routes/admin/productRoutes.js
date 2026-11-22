const express = require('express');
const router = express.Router();
const Product = require('../../models/Product');
const { ensureAuthenticated, ensureAdmin } = require('../../Middleware/auth');
const upload = require('../../Middleware/upload');
const productController = require('../../controllers/productController');

// Apply authentication and admin middleware to all routes
router.use(ensureAuthenticated, ensureAdmin);

// Safe upload wrapper that catches errors and never throws unhandled 500
const safeUpload = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      console.warn('Multer upload warning/error:', err.message);
      req.uploadError = err.message;
    }
    next();
  });
};

// Get all products
router.get('/', async (req, res) => {
    try {
        const products = await Product.find().populate('category');
        res.render('admin/products', {
            products,
            title: 'Products Management'
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        req.flash('error', 'Failed to fetch products');
        res.redirect('/admin/dashboard');
    }
});

// Get single product
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('category');
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ product });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Failed to fetch product details' });
    }
});

// Create product (supports both / and /create)
router.post('/create', safeUpload, productController.createProduct);
router.post('/', safeUpload, productController.createProduct);

// Reorder products in bulk (MUST be before /:id)
router.post('/reorder', productController.reorderProducts);

// Update product (supports both POST and PUT)
router.post('/:id', safeUpload, productController.updateProduct);
router.put('/:id', safeUpload, productController.updateProduct);

// Delete product
router.delete('/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

module.exports = router;

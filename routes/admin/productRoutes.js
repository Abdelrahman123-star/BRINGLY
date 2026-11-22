const express = require('express');
const router = express.Router();
const Product = require('../../models/Product');
const { ensureAuthenticated, ensureAdmin } = require('../../Middleware/auth');
const upload = require('../../Middleware/upload');

// Apply authentication and admin middleware to all routes
router.use(ensureAuthenticated, ensureAdmin);

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

// Create product
router.post('/', upload.any(), async (req, res) => {
    try {
        const { name, description, price, stock, category, discount, productLink, selectedThumbnail, existingImagesJson, imageUrl } = req.body;
        
        let uploadedImages = [];
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            uploadedImages = req.files.map(f => `/uploads/${f.filename}`);
        } else if (req.file) {
            uploadedImages = [`/uploads/${req.file.filename}`];
        }

        let urlImages = [];
        if (imageUrl && imageUrl.trim()) {
            urlImages = imageUrl.split(',').map(u => u.trim()).filter(u => u.length > 0);
        }

        let existingImages = [];
        if (existingImagesJson) {
            try {
                const parsed = JSON.parse(existingImagesJson);
                if (Array.isArray(parsed)) existingImages = parsed.filter(Boolean);
            } catch (e) {}
        }

        const allImages = [...existingImages, ...uploadedImages, ...urlImages];

        let chosenThumbnail = '';
        if (selectedThumbnail) {
            if (selectedThumbnail.startsWith('upload:') || selectedThumbnail.startsWith('new:')) {
                const idx = parseInt(selectedThumbnail.split(':')[1], 10);
                if (!isNaN(idx) && uploadedImages[idx]) {
                    chosenThumbnail = uploadedImages[idx];
                }
            } else if (allImages.includes(selectedThumbnail)) {
                chosenThumbnail = selectedThumbnail;
            } else {
                const idx = parseInt(selectedThumbnail, 10);
                if (!isNaN(idx) && allImages[idx]) {
                    chosenThumbnail = allImages[idx];
                }
            }
        }

        if (!chosenThumbnail && allImages.length > 0) {
            chosenThumbnail = allImages[0];
        }

        let formattedLink = productLink ? productLink.trim() : '';
        if (formattedLink && !/^https?:\/\//i.test(formattedLink)) {
            formattedLink = 'https://' + formattedLink;
        }

        let imagePath = '';
        let mainImageUrl = '';
        if (chosenThumbnail.startsWith('http://') || chosenThumbnail.startsWith('https://')) {
            mainImageUrl = chosenThumbnail;
        } else if (chosenThumbnail) {
            imagePath = chosenThumbnail;
        }

        const product = new Product({
            name,
            description,
            price,
            stock,
            category,
            discount: discount || 0,
            imagePath,
            imageUrl: mainImageUrl,
            thumbnail: chosenThumbnail,
            images: allImages,
            productLink: formattedLink
        });

        await product.save();
        req.flash('success', 'Product created successfully');
        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error creating product:', error);
        req.flash('error', 'Failed to create product');
        res.redirect('/admin/products');
    }
});

// Update product
router.put('/:id', upload.any(), async (req, res) => {
    try {
        const { name, description, price, stock, category, discount, productLink, selectedThumbnail, existingImagesJson, imageUrl } = req.body;
        let formattedLink = typeof productLink !== 'undefined' ? productLink.trim() : '';
        if (formattedLink && !/^https?:\/\//i.test(formattedLink)) {
            formattedLink = 'https://' + formattedLink;
        }

        const currentProduct = await Product.findById(req.params.id);
        if (!currentProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        let existingImages = [];
        if (typeof existingImagesJson !== 'undefined') {
            try {
                const parsed = JSON.parse(existingImagesJson);
                if (Array.isArray(parsed)) existingImages = parsed.filter(Boolean);
            } catch (e) {}
        } else if (currentProduct.images && currentProduct.images.length > 0) {
            existingImages = [...currentProduct.images];
        } else if (currentProduct.imagePath || currentProduct.imageUrl) {
            existingImages = [currentProduct.imagePath || currentProduct.imageUrl].filter(Boolean);
        }

        let uploadedImages = [];
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            uploadedImages = req.files.map(f => `/uploads/${f.filename}`);
        } else if (req.file) {
            uploadedImages = [`/uploads/${req.file.filename}`];
        }

        let urlImages = [];
        if (imageUrl && imageUrl.trim()) {
            urlImages = imageUrl.split(',').map(u => u.trim()).filter(u => u.length > 0 && !existingImages.includes(u));
        }

        const allImages = [...existingImages, ...uploadedImages, ...urlImages];

        let chosenThumbnail = '';
        if (selectedThumbnail) {
            if (selectedThumbnail.startsWith('upload:') || selectedThumbnail.startsWith('new:')) {
                const idx = parseInt(selectedThumbnail.split(':')[1], 10);
                if (!isNaN(idx) && uploadedImages[idx]) {
                    chosenThumbnail = uploadedImages[idx];
                }
            } else if (allImages.includes(selectedThumbnail)) {
                chosenThumbnail = selectedThumbnail;
            } else {
                const idx = parseInt(selectedThumbnail, 10);
                if (!isNaN(idx) && allImages[idx]) {
                    chosenThumbnail = allImages[idx];
                }
            }
        }

        if (!chosenThumbnail) {
            if (currentProduct.thumbnail && allImages.includes(currentProduct.thumbnail)) {
                chosenThumbnail = currentProduct.thumbnail;
            } else if (allImages.length > 0) {
                chosenThumbnail = allImages[0];
            }
        }

        let imagePath = '';
        let mainImageUrl = '';
        if (chosenThumbnail.startsWith('http://') || chosenThumbnail.startsWith('https://')) {
            mainImageUrl = chosenThumbnail;
        } else if (chosenThumbnail) {
            imagePath = chosenThumbnail;
        }

        const updateData = {
            name,
            description,
            price,
            stock,
            category,
            discount: discount || 0,
            productLink: formattedLink,
            images: allImages,
            thumbnail: chosenThumbnail,
            imagePath,
            imageUrl: mainImageUrl
        };

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        res.json({ success: true, message: 'Product updated successfully', product });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

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
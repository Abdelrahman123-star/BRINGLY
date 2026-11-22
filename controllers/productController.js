const { Product } = require('../dataBase');
const upload = require('../Middleware/upload');
const Discount = require('../models/discount');
const Comment = require('../models/Comment');

// Get all products
exports.getAllProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;
        const sort = req.query.sort || 'newest';
        const minRating = parseFloat(req.query.rating) || 0;

        // Build sort object based on sort parameter
        let sortObj = {};
        switch(sort) {
            case 'price-low':
                sortObj = { price: 1 };
                break;
            case 'price-high':
                sortObj = { price: -1 };
                break;
            case 'rating':
                sortObj = { rating: -1 };
                break;
            default: // newest
                sortObj = { createdAt: -1 };
        }

        // Build query object
        const query = {};
        if (minRating > 0) {
            query.rating = { $gte: minRating };
        }

        const [products, totalProducts] = await Promise.all([
            Product.find(query)
                .populate('category', 'name slug')
                .sort(sortObj)
                .skip(skip)
                .limit(limit),
            Product.countDocuments(query)
        ]);

        const totalPages = Math.ceil(totalProducts / limit);
        res.render('admin/products', {
            user: req.session.user,
            activePage: 'products',
            products,
            currentPage: page,
            totalPages,
            currentSort: sort,
            currentRating: req.query.rating || '',
            messages: {
                success: req.flash('success'),
                error: req.flash('error')
            }
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        req.flash('error', 'Failed to load products');
        res.status(500).render('admin/products', {
            products: [],
            currentPage: 1,
            totalPages: 1,
            currentSort: 'newest',
            currentRating: '',
            messages: {
                error: 'Failed to load products'
            }
        });
    }
};

// Get a single product by ID (for edit)
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate({
                path: 'category',
                select: 'name slug _id'
            });
            
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Ensure we have the complete category information
        if (!product.category) {
            return res.status(404).json({ error: 'Category not found for this product' });
        }

        res.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
};

// Create a new product
exports.createProduct = async (req, res) => {
    try {
        const { 
            productName: name, 
            productPrice: price, 
            productStock: stock, 
            productCategory: category,
            productDescription: description,
            imageUrl,
            productLink,
            selectedThumbnail,
            existingImagesJson
        } = req.body;

        // Validate required fields
        if (!name || !price || !stock || !category) {
            req.flash('error', 'Please fill in all required fields');
            return res.redirect('/admin/products');
        }

        // Validate price and stock are positive numbers
        const parsedPrice = parseFloat(price);
        const parsedStock = parseInt(stock);

        if (isNaN(parsedPrice) || parsedPrice < 0) {
            req.flash('error', 'Please enter a valid price');
            return res.redirect('/admin/products');
        }

        if (isNaN(parsedStock) || parsedStock < 0) {
            req.flash('error', 'Please enter a valid stock quantity');
            return res.redirect('/admin/products');
        }
        
        // Collect uploaded files
        let uploadedImages = [];
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            uploadedImages = req.files.map(f => '/uploads/' + f.filename);
        } else if (req.file) {
            uploadedImages = ['/uploads/' + req.file.filename];
        }

        // Collect URL images (supports comma-separated URLs or single URL)
        let urlImages = [];
        if (imageUrl && imageUrl.trim()) {
            urlImages = imageUrl.split(',').map(u => u.trim()).filter(u => u.length > 0);
        }

        // Collect existing images if passed
        let existingImages = [];
        if (existingImagesJson) {
            try {
                const parsed = JSON.parse(existingImagesJson);
                if (Array.isArray(parsed)) {
                    existingImages = parsed.filter(Boolean);
                }
            } catch (e) {}
        }

        // Combine all images
        const allImages = [...existingImages, ...uploadedImages, ...urlImages];

        // Determine thumbnail
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

        // Fallback thumbnail if not explicitly chosen
        if (!chosenThumbnail && allImages.length > 0) {
            chosenThumbnail = allImages[0];
        }

        let mainImageUrl = '';
        let imagePath = '';
        if (chosenThumbnail.startsWith('http://') || chosenThumbnail.startsWith('https://')) {
            mainImageUrl = chosenThumbnail;
        } else if (chosenThumbnail) {
            imagePath = chosenThumbnail;
        }

        let formattedLink = productLink ? productLink.trim() : '';
        if (formattedLink && !/^https?:\/\//i.test(formattedLink)) {
            formattedLink = 'https://' + formattedLink;
        }

        const newProduct = new Product({
            name,
            price: parsedPrice,
            stock: parsedStock,
            category,
            description: description || '',
            imageUrl: mainImageUrl,
            imagePath,
            thumbnail: chosenThumbnail,
            images: allImages,
            productLink: formattedLink
        });

        await newProduct.save();
        req.flash('success', 'Product added successfully');
        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error creating product:', error);
        req.flash('error', error.message || 'Failed to create product');
        res.redirect('/admin/products');
    }
};

// Update a product
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            productName: name, 
            productPrice: price, 
            productStock: stock, 
            productCategory: category,
            productDescription: description,
            imageUrl,
            productLink,
            selectedThumbnail,
            existingImagesJson
        } = req.body;

        // Validate required fields
        if (!name || !price || !stock || !category) {
            return res.status(400).json({ error: 'Please fill in all required fields' });
        }

        // Validate price and stock are positive numbers
        const parsedPrice = parseFloat(price);
        const parsedStock = parseInt(stock);

        if (isNaN(parsedPrice) || parsedPrice < 0) {
            return res.status(400).json({ error: 'Please enter a valid price' });
        }

        if (isNaN(parsedStock) || parsedStock < 0) {
            return res.status(400).json({ error: 'Please enter a valid stock quantity' });
        }

        const currentProduct = await Product.findById(id);
        if (!currentProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Collect existing images
        let existingImages = [];
        if (typeof existingImagesJson !== 'undefined') {
            try {
                const parsed = JSON.parse(existingImagesJson);
                if (Array.isArray(parsed)) {
                    existingImages = parsed.filter(Boolean);
                }
            } catch (e) {}
        } else if (currentProduct.images && currentProduct.images.length > 0) {
            existingImages = [...currentProduct.images];
        } else if (currentProduct.imagePath || currentProduct.imageUrl) {
            existingImages = [currentProduct.imagePath || currentProduct.imageUrl].filter(Boolean);
        }

        // Collect newly uploaded files
        let uploadedImages = [];
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            uploadedImages = req.files.map(f => '/uploads/' + f.filename);
        } else if (req.file) {
            uploadedImages = ['/uploads/' + req.file.filename];
        }

        // Collect new URL images
        let urlImages = [];
        if (imageUrl && imageUrl.trim()) {
            urlImages = imageUrl.split(',').map(u => u.trim()).filter(u => u.length > 0 && !existingImages.includes(u));
        }

        // Combine all images
        const allImages = [...existingImages, ...uploadedImages, ...urlImages];

        // Determine thumbnail
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

        // Fallback thumbnail if none resolved
        if (!chosenThumbnail) {
            if (currentProduct.thumbnail && allImages.includes(currentProduct.thumbnail)) {
                chosenThumbnail = currentProduct.thumbnail;
            } else if (allImages.length > 0) {
                chosenThumbnail = allImages[0];
            }
        }

        let mainImageUrl = '';
        let imagePath = '';
        if (chosenThumbnail.startsWith('http://') || chosenThumbnail.startsWith('https://')) {
            mainImageUrl = chosenThumbnail;
        } else if (chosenThumbnail) {
            imagePath = chosenThumbnail;
        }

        let formattedLink = typeof productLink !== 'undefined' ? productLink.trim() : '';
        if (formattedLink && !/^https?:\/\//i.test(formattedLink)) {
            formattedLink = 'https://' + formattedLink;
        }

        const updateData = {
            name,
            price: parsedPrice,
            stock: parsedStock,
            category: category,
            description: description || '',
            productLink: formattedLink,
            images: allImages,
            thumbnail: chosenThumbnail,
            imagePath,
            imageUrl: mainImageUrl
        };

        const updatedProduct = await Product.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
            return res.json({ success: true, message: 'Product updated successfully', product: updatedProduct });
        }

        req.flash('success', 'Product updated successfully');
        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error updating product:', error);
        req.flash('error', error.message || 'Failed to update product');
        res.redirect('/admin/products');
    }
};


// Delete a product
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        
        // First find the product to get its comments
        const product = await Product.findById(id);
        if (!product) {
            req.flash('error', 'Product not found');
            return res.redirect('/admin/products');
        }

        // Delete all comments associated with this product
        await Comment.deleteMany({ product: id });

        // Then delete the product
        await Product.findByIdAndDelete(id);

        req.flash('success', 'Product and associated comments deleted successfully');
        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error deleting product:', error);
        req.flash('error', 'Failed to delete product: ' + error.message);
        res.redirect('/admin/products');
    }
};

exports.getProductDetail = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId)
      .populate('category', 'name');

    if (!product) {
      req.flash('error', 'Product not found');
      return res.redirect('/');
    }

    let originalPrice = product.price;
    let discountedPrice = product.price;
    let discountPercentage = 0;

    const activeDiscounts = await Discount.find();

    for (const discount of activeDiscounts) {
      const isProductInDiscount = discount.products.some(pId => pId.toString() === product._id.toString());
      const isCategoryInDiscount = product.category && discount.categories.some(cId => cId.toString() === product.category._id.toString());

      if ((discount.products.length === 0 && discount.categories.length === 0) || isProductInDiscount || isCategoryInDiscount) {
        const potentialDiscountedPrice = discount.calculateDiscountedPrice(product.price);

        if (potentialDiscountedPrice < discountedPrice) {
          discountedPrice = potentialDiscountedPrice;
          if (discount.type === 'percentage') {
            discountPercentage = discount.value;
          } else {
            discountPercentage = ((originalPrice - discountedPrice) / originalPrice) * 100;
          }
        }
      }
    }

    // Get related products (products from the same category)
    const relatedProducts = await Product.find({
      category: product.category._id,
      _id: { $ne: product._id }
    })
    .limit(3)
    .select('name price imageUrl imagePath');

    res.render('products/detail', {
      product,
      relatedProducts,
      user: req.session.user || null,
      originalPrice: originalPrice.toFixed(2),
      discountedPrice: discountedPrice.toFixed(2),
      discountPercentage: discountPercentage.toFixed(0),
      hasDiscount: discountedPrice < originalPrice,
      messages: {
        success: req.flash('success'),
        error: req.flash('error')
      }
    });
  } catch (error) {
    console.error('Error fetching product details:', error);
    req.flash('error', 'Error loading product details');
    res.redirect('/');
  }
};

// Get product details with comments and discount calculation
exports.getProductDetails = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId)
            .populate('category', 'name slug')
            .populate({
                path: 'comments',
                populate: {
                    path: 'user',
                    select: 'username',
                    model: 'Users'
                }
            });

        if (!product) {
            req.flash('error', 'Product not found');
            return res.redirect('/products');
        }

        // Get related products (same category, excluding current product)
        const relatedProducts = await Product.find({
            category: product.category._id,
            _id: { $ne: product._id }
        })
        .limit(4)
        .populate('category', 'name slug');

        let originalPrice = product.price;
        let discountedPrice = product.price;
        let discountPercentage = 0;
        let hasDiscount = false;

        const now = new Date();
        const activeDiscounts = await Discount.find({
            status: 'active',
            startDate: { $lte: now },
            endDate: { $gte: now }
        });

        for (const discount of activeDiscounts) {
            const isProductInDiscount = discount.products.some(pId => pId.toString() === product._id.toString());
            const isCategoryInDiscount = product.category && discount.categories.some(cId => cId.toString() === product.category._id.toString());

            if ((discount.products.length === 0 && discount.categories.length === 0) || isProductInDiscount || isCategoryInDiscount) {
                const potentialDiscountedPrice = discount.calculateDiscountedPrice(product.price);

                if (potentialDiscountedPrice < discountedPrice) {
                    discountedPrice = potentialDiscountedPrice;
                    hasDiscount = true;

                    if (discount.type === 'percentage') {
                        discountPercentage = discount.value;
                    } else {
                        discountPercentage = ((originalPrice - discountedPrice) / originalPrice) * 100;
                    }
                }
            }
        }

        // Get approved comments
        const comments = product.comments.filter(comment => comment.status === 'approved');

        res.render('products/detail', {
            product,
            relatedProducts,
            user: req.session.user || null,
            originalPrice: originalPrice.toFixed(2),
            discountedPrice: discountedPrice.toFixed(2),
            discountPercentage: discountPercentage.toFixed(0),
            hasDiscount: hasDiscount,
            comments,
            session: req.session,
            messages: {
                success: req.flash('success'),
                error: req.flash('error')
            }
        });
    } catch (error) {
        console.error('Error fetching product details:', error);
        req.flash('error', 'Error loading product details');
        res.redirect('/');
    }
};
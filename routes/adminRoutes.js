const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminCategoryController = require('../controllers/AdminCategoryController');
const upload = require('../Middleware/upload');
const multer = require('multer');
const discountController = require('../controllers/discountController');
const settingController = require('../controllers/settingController');
const productRoutes = require('./admin/productRoutes');
const categoryRoutes = require('./admin/categoryRoutes');
const cartRoutes = require('./admin/cartRoutes');
const orderRoutes = require('./admin/orderRoutes');
const adminRequestController = require('../controllers/adminRequestController');
const adminMessageController = require('../controllers/adminMessageController');

const { ensureAdmin } = require('../Middleware/auth');

router.get('/', ensureAdmin, (req, res) => {
  res.redirect('/admin/dashboard');
});

router.get('/dashboard', ensureAdmin, (req, res) => {
  adminController.showDashboard(req,res,'dashboard');
});
router.get('/products', ensureAdmin, (req, res) => {
  adminController.showProducts(req, res, 'products');
});

router.get('/categories', ensureAdmin, (req, res) => {
  adminCategoryController.listCategories(req, res, 'categories');
});

router.post('/categories/create', ensureAdmin, (req, res, next) => {
  upload.single('categoryImage')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      console.error('Multer Error:', err);
      req.flash('error', `File upload error: ${err.message}`);
      return res.redirect('/admin/categories');
    } else if (err) {
      console.error('Unknown Upload Error:', err);
      req.flash('error', `Upload error: ${err.message}`);
      return res.redirect('/admin/categories');
    }
    next();
  });
}, adminCategoryController.createCategory);

router.post('/categories/delete/:id', ensureAdmin, adminCategoryController.deleteCategory);

router.get('/users', ensureAdmin, (req, res) => {
  adminController.showUsers(req, res, 'users');
});
router.post('/users', ensureAdmin, (req, res) => {
  adminController.editUser(req, res, 'users');
});
router.post('/users/delete', ensureAdmin, adminController.deleteUser);

router.post('/users/create', ensureAdmin, adminController.createUser);

router.get('/users/search', ensureAdmin, adminController.searchUsers);

// Settings routes
router.get('/settings', ensureAdmin, settingController.getSettings);
router.post('/settings', ensureAdmin, settingController.updateSettings);

// Discount routes
router.get('/discounts', ensureAdmin, discountController.getAllDiscounts);
router.get('/discounts/create', ensureAdmin, discountController.showCreateForm);
router.post('/discounts/create', ensureAdmin, discountController.createDiscount);
router.get('/discounts/:id/edit', ensureAdmin, discountController.showEditForm);
router.post('/discounts/:id/edit', ensureAdmin, discountController.updateDiscount);
router.post('/discounts/:id/delete', ensureAdmin, discountController.deleteDiscount);

// Germany Product Requests routes
router.get('/requests', ensureAdmin, adminRequestController.listRequests);
router.post('/requests/:id/update', ensureAdmin, adminRequestController.updateRequest);
router.post('/requests/:id/delete', ensureAdmin, adminRequestController.deleteRequest);

// Customer Inquiries / Messages routes
router.get('/messages', ensureAdmin, adminMessageController.listMessages);
router.get('/messages/:id', ensureAdmin, adminMessageController.getMessage);
router.post('/messages/:id/update', ensureAdmin, adminMessageController.updateMessage);
router.post('/messages/:id/delete', ensureAdmin, adminMessageController.deleteMessage);

// Admin routes
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/carts', cartRoutes);
router.use('/orders', orderRoutes);

module.exports = router;
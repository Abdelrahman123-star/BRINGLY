const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { ensureAuthenticated } = require('../Middleware/auth');
const orderController = require('../controllers/orderController');

// Order confirmation page
router.get('/confirmation/:orderId', ensureAuthenticated, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order) {
            req.flash('error', 'Order not found.');
            return res.redirect('/myCart');
        }
        res.render('order/confirmation', { order });
    } catch (error) {
        console.error('Error fetching order:', error);
        req.flash('error', 'Failed to load order details.');
        res.redirect('/myCart');
    }
});

const ProductRequest = require('../models/ProductRequest');

// My Orders & Requests page
router.get('/myOrders', ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.session.user._id || req.session.user.id;
        const [orders, requests] = await Promise.all([
            Order.find({ user: userId }).sort({ orderDate: -1 }),
            ProductRequest.find({
                $or: [
                    { user: userId },
                    { customerEmail: req.session.user.email ? req.session.user.email.toLowerCase() : '' }
                ]
            }).sort({ createdAt: -1 })
        ]);

        res.render('order/myOrders', { 
            orders, 
            requests,
            session: req.session,
            searchTerm: ''
        });
    } catch (error) {
        console.error('Error fetching orders & requests:', error);
        req.flash('error', 'Failed to load your orders.');
        res.redirect('/');
    }
});

router.get('/api/user-orders', orderController.getUserOrders);

module.exports = router;
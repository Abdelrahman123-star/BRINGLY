const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');

// Submit new Germany sourcing request
router.post('/request-product', requestController.submitRequest);

// Track Germany sourcing request (public lookup)
router.get('/track-request', requestController.showTrackingPage);
router.get('/track-request/:code', requestController.showTrackingPage);
router.post('/api/track-request', requestController.apiLookupRequest);
router.get('/my-requests', requestController.showTrackingPage);

module.exports = router;

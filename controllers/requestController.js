const ProductRequest = require('../models/ProductRequest');
const { sendRequestReceiptEmail } = require('../services/requestNotificationService');

exports.submitRequest = async (req, res) => {
    try {
        const {
            productName,
            category,
            specifications,
            referenceUrl,
            targetBudget,
            customerName,
            customerPhone,
            customerEmail
        } = req.body;

        // Validation
        if (!productName || !category || !specifications || !customerName || !customerPhone || !customerEmail) {
            const errorMsg = 'Please fill in all required fields (Product Name, Category, Specifications, Name, Phone, Email).';
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.status(400).json({ success: false, error: errorMsg });
            }
            req.flash('error_msg', errorMsg);
            return res.redirect('/#germany-request');
        }

        // Create new request
        const newRequest = new ProductRequest({
            productName: productName.trim(),
            category: category.trim(),
            specifications: specifications.trim(),
            referenceUrl: referenceUrl ? referenceUrl.trim() : '',
            targetBudget: targetBudget && !isNaN(targetBudget) ? parseFloat(targetBudget) : null,
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            customerEmail: customerEmail.trim().toLowerCase(),
            user: req.session.user ? (req.session.user._id || req.session.user.id) : null
        });

        await newRequest.save();

        // Send automated receipt email in the background
        sendRequestReceiptEmail(newRequest).catch(err => {
            console.error('Failed to send receipt email in background:', err.message);
        });

        const successMsg = `Request #${newRequest.requestCode} submitted successfully! We will check availability in Germany and notify you on WhatsApp/Email.`;

        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(201).json({
                success: true,
                message: successMsg,
                requestCode: newRequest.requestCode,
                request: newRequest
            });
        }

        req.flash('success_msg', successMsg);
        res.redirect('/#germany-request');
    } catch (error) {
        console.error('Error submitting Germany product request:', error);
        const errMsg = 'Failed to submit your request. Please try again.';
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(500).json({ success: false, error: errMsg });
        }
        req.flash('error_msg', errMsg);
        res.redirect('/#germany-request');
    }
};

/**
 * Public Request Tracking Page
 * Accessible via /track-request or /track-request/:code or /track-request?code=DE-XXXXXX
 */
exports.showTrackingPage = async (req, res) => {
    try {
        const rawCode = req.params.code || req.query.code || req.query.q || '';
        const searchCode = rawCode.trim().replace(/^#/, '');

        let foundRequest = null;
        let notFound = false;

        if (searchCode) {
            // Find by requestCode (case-insensitive) or customerPhone
            foundRequest = await ProductRequest.findOne({
                $or: [
                    { requestCode: new RegExp('^' + searchCode + '$', 'i') },
                    { customerPhone: searchCode }
                ]
            });

            if (!foundRequest) {
                notFound = true;
            }
        }

        // If user is logged in and no specific code searched, fetch their recent requests
        let userRequests = [];
        if (req.session?.user && !foundRequest) {
            const userId = req.session.user._id || req.session.user.id;
            userRequests = await ProductRequest.find({
                $or: [
                    { user: userId },
                    { customerEmail: req.session.user.email?.toLowerCase() }
                ]
            }).sort({ createdAt: -1 });
        }

        res.render('pages/trackRequest', {
            request: foundRequest,
            searchQuery: rawCode,
            notFound,
            userRequests,
            session: req.session,
            searchTerm: '',
            success: req.flash('success_msg'),
            error: req.flash('error_msg')
        });
    } catch (error) {
        console.error('Error loading request tracking page:', error);
        res.status(500).render('error', {
            message: 'Unable to load request tracking details.',
            error: process.env.NODE_ENV === 'development' ? error : {},
            user: req.session.user || null
        });
    }
};

/**
 * API lookup endpoint for quick AJAX tracking
 */
exports.apiLookupRequest = async (req, res) => {
    try {
        const { code } = req.body;
        if (!code || !code.trim()) {
            return res.status(400).json({ success: false, error: 'Please provide a valid request tracking code or phone number.' });
        }

        const cleanCode = code.trim().replace(/^#/, '');
        const request = await ProductRequest.findOne({
            $or: [
                { requestCode: new RegExp('^' + cleanCode + '$', 'i') },
                { customerPhone: cleanCode }
            ]
        });

        if (!request) {
            return res.status(404).json({ success: false, error: `No request found with code or phone: ${code}` });
        }

        res.json({ success: true, request });
    } catch (error) {
        console.error('API request lookup error:', error);
        res.status(500).json({ success: false, error: 'Server error while looking up request.' });
    }
};

const ProductRequest = require('../models/ProductRequest');
const { 
    sendQuoteReadyEmail, 
    sendStatusUpdateEmail, 
    formatWhatsAppQuoteMessage, 
    formatWhatsAppPhone 
} = require('../services/requestNotificationService');

exports.listRequests = async (req, res) => {
    try {
        const { status, q } = req.query;
        let query = {};

        if (status && status !== 'all') {
            query.status = status;
        }

        if (q && q.trim() !== '') {
            const regex = new RegExp(q.trim(), 'i');
            query.$or = [
                { requestCode: regex },
                { productName: regex },
                { customerName: regex },
                { customerPhone: regex },
                { customerEmail: regex }
            ];
        }

        // Fetch requests sorted by newest first
        const [
            requests,
            totalCount,
            pendingCount,
            sourcedCount,
            shippedCount,
            deliveredCount
        ] = await Promise.all([
            ProductRequest.find(query).sort({ createdAt: -1 }),
            ProductRequest.countDocuments(),
            ProductRequest.countDocuments({ status: 'Pending' }),
            ProductRequest.countDocuments({ status: 'Sourced in Germany' }),
            ProductRequest.countDocuments({ status: 'Shipped to Egypt' }),
            ProductRequest.countDocuments({ status: 'Delivered' })
        ]);

        res.render('admin/requests', {
            user: req.session.user,
            activePage: 'requests',
            requests,
            currentStatus: status || 'all',
            searchQuery: q || '',
            stats: {
                total: totalCount,
                pending: pendingCount,
                sourced: sourcedCount,
                shipped: shippedCount,
                delivered: deliveredCount
            },
            formatWhatsAppPhone,
            formatWhatsAppQuoteMessage,
            success: req.flash('success_msg'),
            error: req.flash('error_msg')
        });
    } catch (error) {
        console.error('Error fetching Germany product requests:', error);
        res.status(500).render('error', {
            message: 'Failed to load Germany product requests',
            error: process.env.NODE_ENV === 'development' ? error : {},
            user: req.session.user || null
        });
    }
};

exports.updateRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, quotedPrice, adminNotes } = req.body;

        const oldRequest = await ProductRequest.findById(id);
        if (!oldRequest) {
            req.flash('error_msg', 'Product request not found.');
            return res.redirect('/admin/requests');
        }

        const updateData = {};
        if (status) updateData.status = status;
        if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
        if (quotedPrice !== undefined && quotedPrice !== '') {
            updateData.quotedPrice = parseFloat(quotedPrice);
        }

        const updated = await ProductRequest.findByIdAndUpdate(id, updateData, { new: true });

        // Automated customer notification via Email
        const isNewOrUpdatedQuote = (updateData.quotedPrice && updateData.quotedPrice !== oldRequest.quotedPrice) || 
                                    (updateData.status === 'Quoted' && oldRequest.status !== 'Quoted');

        if (isNewOrUpdatedQuote) {
            // Customer gets email with quoted price & tracking link
            sendQuoteReadyEmail(updated).catch(err => {
                console.error('Error sending quote email:', err.message);
            });
        } else if (updateData.status && updateData.status !== oldRequest.status) {
            // Customer gets status progress email (e.g. Sourced in Germany, Shipped to Egypt, Delivered)
            sendStatusUpdateEmail(updated, updateData.status).catch(err => {
                console.error('Error sending status update email:', err.message);
            });
        }

        const waMsg = formatWhatsAppQuoteMessage(updated);
        const waPhone = formatWhatsAppPhone(updated.customerPhone);
        const waLink = `https://wa.me/${waPhone}?text=${encodeURIComponent(waMsg)}`;

        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.json({ 
                success: true, 
                message: isNewOrUpdatedQuote 
                    ? `Request updated! Email sent to ${updated.customerEmail} with quote.`
                    : 'Request updated successfully!', 
                request: updated,
                waLink,
                waMsg
            });
        }

        req.flash('success_msg', isNewOrUpdatedQuote 
            ? `Request #${updated.requestCode} updated and quote email sent to ${updated.customerEmail}!`
            : `Request #${updated.requestCode} updated successfully!`);
        res.redirect('/admin/requests');
    } catch (error) {
        console.error('Error updating product request:', error);
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(500).json({ success: false, error: 'Failed to update request.' });
        }
        req.flash('error_msg', 'Failed to update request.');
        res.redirect('/admin/requests');
    }
};

exports.deleteRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await ProductRequest.findByIdAndDelete(id);

        if (!deleted) {
            req.flash('error_msg', 'Request not found.');
            return res.redirect('/admin/requests');
        }

        req.flash('success_msg', `Request ${deleted.requestCode} was deleted.`);
        res.redirect('/admin/requests');
    } catch (error) {
        console.error('Error deleting product request:', error);
        req.flash('error_msg', 'Failed to delete request.');
        res.redirect('/admin/requests');
    }
};

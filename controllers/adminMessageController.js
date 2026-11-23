const Message = require('../models/Message');
const transporter = require('../config/emailConfig');

/**
 * Helper to clean and format phone for WhatsApp
 */
function formatWhatsAppPhone(rawPhone) {
    if (!rawPhone) return '';
    let clean = rawPhone.replace(/[^0-9]/g, '');
    if (clean.startsWith('01')) {
        clean = '2' + clean;
    } else if (!clean.startsWith('20') && clean.startsWith('1')) {
        clean = '20' + clean;
    }
    return clean;
}

/**
 * List all customer messages with search & status filters
 */
exports.listMessages = async (req, res) => {
    try {
        const { status, q } = req.query;
        let query = {};

        if (status && status !== 'all') {
            query.status = status;
        }

        if (q && q.trim() !== '') {
            const regex = new RegExp(q.trim(), 'i');
            query.$or = [
                { name: regex },
                { email: regex },
                { phone: regex },
                { topic: regex },
                { message: regex }
            ];
        }

        const [
            messagesList,
            totalCount,
            unreadCount,
            readCount,
            repliedCount
        ] = await Promise.all([
            Message.find(query).sort({ createdAt: -1 }),
            Message.countDocuments(),
            Message.countDocuments({ status: 'unread' }),
            Message.countDocuments({ status: 'read' }),
            Message.countDocuments({ status: 'replied' })
        ]);

        res.render('admin/messages', {
            user: req.session.user,
            activePage: 'messages',
            messagesList,
            currentStatus: status || 'all',
            searchQuery: q || '',
            stats: {
                total: totalCount,
                unread: unreadCount,
                read: readCount,
                replied: repliedCount
            },
            formatWhatsAppPhone,
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (error) {
        console.error('Error fetching admin messages:', error);
        res.status(500).render('admin/messages', {
            user: req.session.user,
            activePage: 'messages',
            messagesList: [],
            currentStatus: 'all',
            searchQuery: '',
            stats: { total: 0, unread: 0, read: 0, replied: 0 },
            formatWhatsAppPhone,
            success: [],
            error: ['Failed to load customer messages.']
        });
    }
};

/**
 * Get single message details as JSON
 */
exports.getMessage = async (req, res) => {
    try {
        const msg = await Message.findById(req.params.id);
        if (!msg) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }
        res.json({ success: true, message: msg });
    } catch (error) {
        console.error('Error getting message:', error);
        res.status(500).json({ success: false, message: 'Server error retrieving message' });
    }
};

/**
 * Update message status and optionally send reply via email
 */
exports.updateMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, replyText, sendEmailReply } = req.body;

        const messageRecord = await Message.findById(id);
        if (!messageRecord) {
            if (req.xhr || req.headers.accept?.includes('json')) {
                return res.status(404).json({ success: false, message: 'Message not found' });
            }
            req.flash('error', 'Message not found');
            return res.redirect('/admin/messages');
        }

        if (status) {
            messageRecord.status = status;
        }

        // If email reply is provided and requested
        if (replyText && replyText.trim() !== '') {
            messageRecord.adminReply = replyText.trim();
            messageRecord.repliedAt = new Date();
            messageRecord.status = 'replied';

            if (sendEmailReply === true || sendEmailReply === 'true' || sendEmailReply === 'on') {
                const mailSubject = `Re: ${messageRecord.topic || 'Inquiry'} — BRINGLY Atelier`;
                const emailHtml = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <meta charset="utf-8">
                      <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
                        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
                        .header { background: #1A2238; padding: 30px; text-align: center; color: #ffffff; }
                        .header h1 { margin: 0; font-size: 24px; letter-spacing: 2px; }
                        .header p { margin: 6px 0 0; color: #ff8a65; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; }
                        .body { padding: 32px 30px; line-height: 1.6; }
                        .reply-box { background: #faf9f6; border-left: 4px solid #ff5722; padding: 18px 20px; border-radius: 0 10px 10px 0; margin: 20px 0; font-size: 15px; color: #1e293b; white-space: pre-line; }
                        .original-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin-top: 24px; font-size: 13px; color: #64748b; }
                        .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
                      </style>
                    </head>
                    <body>
                      <div class="container">
                        <div class="header">
                          <h1>BRINGLY</h1>
                          <p>Atelier Concierge Response</p>
                        </div>
                        <div class="body">
                          <p>Dear <strong>${messageRecord.name}</strong>,</p>
                          <p>Thank you for reaching out to the BRINGLY sourcing desk. Here is our response to your inquiry regarding <strong>${messageRecord.topic}</strong>:</p>
                          
                          <div class="reply-box">${replyText.trim()}</div>
                          
                          <p>If you have any further questions, feel free to reply directly to this email or contact our desk on WhatsApp at <a href="https://wa.me/201006709258" style="color: #ff5722; font-weight: 600;">+20 100 670 9258</a>.</p>
                          
                          <div class="original-box">
                            <strong>Your Original Inquiry (${new Date(messageRecord.createdAt).toLocaleDateString()}):</strong><br>
                            "${messageRecord.message}"
                          </div>
                        </div>
                        <div class="footer">
                          &copy; ${new Date().getFullYear()} BRINGLY. Original European products curated and sourced directly to you.
                        </div>
                      </div>
                    </body>
                    </html>
                `;

                try {
                    await transporter.sendMail({
                        from: `"BRINGLY Concierge" <${process.env.EMAIL_USER || 'no-reply@bringly.com'}>`,
                        to: messageRecord.email,
                        subject: mailSubject,
                        html: emailHtml
                    });
                } catch (emailErr) {
                    console.warn('Warning: Could not send email reply:', emailErr.message);
                }
            }
        }

        await messageRecord.save();

        if (req.xhr || req.headers.accept?.includes('json')) {
            return res.json({ 
                success: true, 
                message: 'Inquiry updated successfully',
                updatedStatus: messageRecord.status 
            });
        }

        req.flash('success', 'Inquiry updated successfully');
        res.redirect('/admin/messages');
    } catch (error) {
        console.error('Error updating message:', error);
        if (req.xhr || req.headers.accept?.includes('json')) {
            return res.status(500).json({ success: false, message: 'Failed to update message' });
        }
        req.flash('error', 'Failed to update message');
        res.redirect('/admin/messages');
    }
};

/**
 * Delete a message
 */
exports.deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Message.findByIdAndDelete(id);
        if (!deleted) {
            if (req.xhr || req.headers.accept?.includes('json')) {
                return res.status(404).json({ success: false, message: 'Message not found' });
            }
            req.flash('error', 'Message not found');
            return res.redirect('/admin/messages');
        }

        if (req.xhr || req.headers.accept?.includes('json')) {
            return res.json({ success: true, message: 'Message deleted successfully' });
        }

        req.flash('success', 'Message deleted successfully');
        res.redirect('/admin/messages');
    } catch (error) {
        console.error('Error deleting message:', error);
        if (req.xhr || req.headers.accept?.includes('json')) {
            return res.status(500).json({ success: false, message: 'Failed to delete message' });
        }
        req.flash('error', 'Failed to delete message');
        res.redirect('/admin/messages');
    }
};


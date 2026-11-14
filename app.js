require('dotenv').config();
const express = require('express');
const https = require('https');
const http = require('http');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const mongoose = require('mongoose');
const { connectDB } = require('./dataBase');

// Safely load local SSL configuration (skipped on Vercel)
let sslConfig = null;
if (!process.env.VERCEL) {
    try {
        sslConfig = require('./config/sslConfig');
    } catch (e) {
        // SSL certs may not be present in all environments
    }
}

const authRoutes = require('./routes/authRoutes');
const pageRoutes = require('./routes/pageRoutes');
const aiRoutes = require('./routes/aiRoutes');
const adminRoutes = require('./routes/adminRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const commentRoutes = require('./routes/commentRoutes');
const cartRoutes = require('./routes/cartRoutes');
const adminCartRoutes = require('./routes/admin/cartRoutes');
const searchRoutes = require('./routes/searchRoutes');
const orderRoutes = require('./routes/orderRoutes');
const requestRoutes = require('./routes/requestRoutes');

const app = express();

// Trust reverse proxy (essential for Vercel, Heroku, and HTTPS cookies)
app.set('trust proxy', 1);

// Ensure MongoDB is connected in serverless environments
app.use(async (req, res, next) => {
    if (mongoose.connection.readyState === 0 && process.env.MONGODB_URI) {
        try {
            await connectDB();
        } catch (err) {
            console.error('Serverless DB connect error:', err);
        }
    }
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration
const sessionOptions = {
    secret: process.env.SESSION_SECRET || 'WebProject_secret_123',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
};

if (process.env.MONGODB_URI) {
    sessionOptions.store = MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        ttl: 24 * 60 * 60 // 1 day
    });
}

app.use(session(sessionOptions));

// Flash middleware
app.use(flash());

// Make session data available to all views
app.use((req, res, next) => {
    res.locals.session = req.session;
    res.locals.user = req.session.user;
    res.locals.searchTerm = req.query.term || '';
    next();
});

// Flash messages
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    next();
});

app.use((req, res, next) => {
    res.locals.messages = req.flash();
    next();
});

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Case-sensitivity alias for static files
app.get('/css/category.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/css/Category.css'));
});

app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', pageRoutes);
app.use('/', authRoutes);
app.use('/', aiRoutes);
app.use('/admin', adminRoutes);
app.use('/admin/products', productRoutes);
app.use('/admin/categories', categoryRoutes);
app.use('/admin/carts', adminCartRoutes);
app.use('/', commentRoutes);
app.use('/products', productRoutes);
app.use('/myCart', cartRoutes);
app.use('/search', searchRoutes);
app.use('/order', orderRoutes);
app.use('/', requestRoutes);

// Catch-all route for undefined URLs
app.use((req, res, next) => {
    res.status(404).render('error', {
        message: 'Page Not Found',
        error: {
            status: 404,
            stack: 'The page you are looking for does not exist.'
        },
        user: req.session ? req.session.user : null
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', {
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err : {},
        user: req.session ? req.session.user : null
    });
});

// Start local server (only when run directly, e.g. `node app.js` locally)
if (require.main === module && !process.env.VERCEL) {
    const HTTP_PORT = process.env.PORT || 3000;
    const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

    if (sslConfig && sslConfig.key && sslConfig.cert) {
        // Create HTTP server for redirection
        const httpApp = express();
        httpApp.use((req, res) => {
            res.redirect(`https://${req.headers.host}${req.url}`);
        });

        const httpServer = http.createServer(httpApp);
        httpServer.listen(HTTP_PORT, '127.0.0.1', (err) => {
            if (err) {
                console.error('Error starting HTTP server:', err);
                return;
            }
            console.log(`HTTP redirect server running on http://127.0.0.1:${HTTP_PORT}`);
        });

        const httpsServer = https.createServer(sslConfig, app);
        httpsServer.listen(HTTPS_PORT, '127.0.0.1', (err) => {
            if (err) {
                console.error('Error starting HTTPS server:', err);
                return;
            }
            console.log(`HTTPS server running on https://127.0.0.1:${HTTPS_PORT}`);
        });
    } else {
        app.listen(HTTP_PORT, () => {
            console.log(`Server running on http://localhost:${HTTP_PORT}`);
        });
    }
}

module.exports = app;

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Detect serverless environments (e.g. Vercel, AWS Lambda)
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NOW_REGION);

let storage;

if (isServerless) {
  // In serverless environments, file system is read-only except /tmp
  // Using memoryStorage allows us to store the file buffer in memory and convert to base64 Data URLs
  storage = multer.memoryStorage();
} else {
  // In local environments, write to public/uploads/
  const uploadDir = path.join(__dirname, '../public/uploads');
  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
      }
    });
  } catch (e) {
    console.warn('Could not initialize disk storage for uploads, falling back to memoryStorage:', e.message);
    storage = multer.memoryStorage();
  }
}

// File filter for images
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype || extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

// Initialize upload with 10MB limit
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

module.exports = upload;

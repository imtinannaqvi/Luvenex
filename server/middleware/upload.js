import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Shared default so large text fields (e.g. rich-text `content`) aren't
// rejected by multer's 1MB default fieldSize. Merge into each config's limits.
const defaultLimits = { fieldSize: 25 * 1024 * 1024 }; // 25MB for text fields

const portfolioDir = 'uploads/portfolio';
if (!fs.existsSync(portfolioDir)) fs.mkdirSync(portfolioDir, { recursive: true });

const portfolioStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, portfolioDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user._id}-${Date.now()}${ext}`);
  },
});

const mediaFileFilter = (req, file, cb) => {
  const allowedImages = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const allowedVideos = ['video/mp4', 'video/webm', 'video/quicktime'];
  if (allowedImages.includes(file.mimetype) || allowedVideos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image (jpg, png, webp, gif) and video (mp4, webm, mov) files are allowed'));
  }
};

export const uploadMedia = multer({
  storage: portfolioStorage,
  fileFilter: mediaFileFilter,
  limits: { ...defaultLimits, fileSize: 50 * 1024 * 1024 },
});

const avatarDir = 'uploads/avatars';
if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user._id}-${Date.now()}${ext}`);
  },
});

const imageOnlyFilter = (req, file, cb) => {
  const allowedImages = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedImages.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, png, webp) are allowed for avatars'));
  }
};

const kycDir = 'uploads/kyc';
if (!fs.existsSync(kycDir)) fs.mkdirSync(kycDir, { recursive: true });

const kycStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, kycDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user._id}-${Date.now()}-${file.fieldname}${ext}`);
  },
});

export const uploadKyc = multer({
  storage: kycStorage,
  fileFilter: imageOnlyFilter,
  limits: { ...defaultLimits, fileSize: 5 * 1024 * 1024 },
});

export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: imageOnlyFilter,
  limits: { ...defaultLimits, fileSize: 5 * 1024 * 1024 },
});

// ✅ NEW cover block — placed AFTER imageOnlyFilter is defined above
const coverDir = 'uploads/covers';
if (!fs.existsSync(coverDir)) fs.mkdirSync(coverDir, { recursive: true });

const coverStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, coverDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user._id}-${Date.now()}${ext}`);
  },
});

export const uploadCover = multer({
  storage: coverStorage,
  fileFilter: imageOnlyFilter,
  limits: { ...defaultLimits, fileSize: 5 * 1024 * 1024 },
});

const servicesDir = 'uploads/services';
if (!fs.existsSync(servicesDir)) fs.mkdirSync(servicesDir, { recursive: true });

const servicesStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, servicesDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});

export const uploadServiceMedia = multer({
  storage: servicesStorage,
  fileFilter: mediaFileFilter,
  limits: { ...defaultLimits, fileSize: 100 * 1024 * 1024 },
});

const blogDir = 'uploads/blog';
if (!fs.existsSync(blogDir)) fs.mkdirSync(blogDir, { recursive: true });

const blogStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, blogDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});

export const uploadBlogMedia = multer({
  storage: blogStorage,
  fileFilter: imageOnlyFilter,
  limits: { ...defaultLimits, fileSize: 10 * 1024 * 1024 },
});

const videosDir = 'uploads/videos';
if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir, { recursive: true });

const videosStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, videosDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user._id}-${Date.now()}${ext}`);
  },
});

const videoOnlyFilter = (req, file, cb) => {
  const allowedVideos = ['video/mp4', 'video/webm', 'video/quicktime'];
  if (allowedVideos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only video files (mp4, webm, mov) are allowed'));
  }
};

export const uploadVideo = multer({
  storage: videosStorage,
  fileFilter: videoOnlyFilter,
  limits: { ...defaultLimits, fileSize: 100 * 1024 * 1024 },
});

const deliveryDir = 'uploads/deliveries';
if (!fs.existsSync(deliveryDir)) fs.mkdirSync(deliveryDir, { recursive: true });

const deliveryStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, deliveryDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user._id}-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});

export const uploadDelivery = multer({
  storage: deliveryStorage,
  fileFilter: mediaFileFilter,
  limits: { ...defaultLimits, fileSize: 100 * 1024 * 1024 },
});


const attachmentDir = 'uploads/attachments';
if (!fs.existsSync(attachmentDir)) fs.mkdirSync(attachmentDir, { recursive: true });

const attachmentStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, attachmentDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user._id}-${Date.now()}${ext}`);
  },
});

const attachmentFileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime', 'application/pdf'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only images, videos, and PDF files are allowed'));
  }
};

export const uploadAttachment = multer({
  storage: attachmentStorage,
  fileFilter: attachmentFileFilter,
  limits: { ...defaultLimits, fileSize: 25 * 1024 * 1024 }, // 25MB
});

const aboutDir = 'uploads/about';
if (!fs.existsSync(aboutDir)) fs.mkdirSync(aboutDir, { recursive: true });

const aboutStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, aboutDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `about-${Date.now()}${ext}`);
  },
});

export const uploadAboutImage = multer({
  storage: aboutStorage,
  fileFilter: imageOnlyFilter,
  limits: {
    ...defaultLimits,            // 25MB fieldSize — fixes "Field value too long"
    fileSize: 10 * 1024 * 1024,  // 10MB hero image
  },
});
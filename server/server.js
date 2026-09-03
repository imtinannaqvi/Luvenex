import dotenv from 'dotenv';
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]:', err.message);
});

process.on('unhandledRejection', (err) => {
  console.error('[UNHANDLED REJECTION]:', err.message);
});
dotenv.config();
console.log('>>> EXPRESS SERVER STARTED', new Date().toISOString());
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import authRouter from './routes/authRoutes.js';
import profileRouter from './routes/profileRoutes.js';
import gigRouter from './routes/gigRoutes.js';
import campiagnRouter from './routes/campiagnRoutes.js';
import { runAutoReleaseSweep } from './services/deal.service.js';
import appicationRouter from './routes/applicationRouter.js';
import dealRouter from './routes/dealRoutes.js';
import walletRouter from './routes/walletRoutes.js';
import reviewRouter from './routes/reviewRoutes.js';
import notificationRouter from './routes/notificationRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import { setupSocket } from './socket.js';
import payoutRouter from './routes/payoutRoutes.js'
import serviceRequestRouter from './routes/servcieRequestRoute.js'
import serviceRouter from './routes/serviceRoutes.js'
import blogRouter from './routes/blogRoutes.js'
import adminRouter from './routes/adminRoutes.js'
import complaintRouter from './routes/complaintRoutes.js'
import videoRouter from './routes/videoRoutes.js'
import FollowRouter from './routes/followRoutes.js'
import ContactRouter from './routes/contcatRoutes.js'
import { runScheduledPublishSweep } from './Controllers/blogController.js';
import VerificationRouter from './routes/verificationRoutes.js'
import settingRouter from './routes/settingsRoutes.js'
import { runInactiveAccountSweep } from './Controllers/authController.js';
import aboutRouter from './routes/aboutRoutes.js'
import multer from 'multer';

connectDB();

const app = express();

// ── CORS ──────────────────────────────────────────────────────────
// Allow the deployed frontend, plus any localhost dev port (Next.js
// bounces between 3000/3001/3002... when a port is taken). Set
// CLIENT_URL in .env to your Amplify URL (no trailing slash).
const allowedOrigins = [
  process.env.CLIENT_URL,
  "https://main.d11kkkdatmlmv7.amplifyapp.com",
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // no origin = curl/server-to-server/mobile apps, allow it
    if (!origin) return callback(null, true);

    const isAllowed =
      allowedOrigins.includes(origin) ||
      /^http:\/\/localhost:\d+$/.test(origin); // any localhost port in dev

    if (isAllowed) return callback(null, true);
    callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(helmet());
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions)); // answer preflight (OPTIONS) for all routes
// ──────────────────────────────────────────────────────────────────

app.use(express.json({ limit: "50mb" }));
app.use('/uploads', express.static('uploads', {
  setHeaders: (res) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  },
}))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Luvenex backend running' });
});

setInterval(async () => {
  const count = await runScheduledPublishSweep();
  if (count > 0) console.log(`[SCHEDULED PUBLISH] Published ${count} posts`);
}, 60 * 1000);

setInterval(async () => {
  const count = await runInactiveAccountSweep();
  if (count > 0) console.log(`[INACTIVE SWEEP] Auto-suspended ${count} unverified accounts`);
}, 24 * 60 * 60 * 1000); // once a day

app.use('/api/auth', authRouter);
app.use('/api', profileRouter);
app.use('/api/gigs', gigRouter);
app.use('/api/campaigns', campiagnRouter);
app.use('/api/applications', appicationRouter);
app.use('/api/deals', dealRouter);
app.use('/api/wallet', walletRouter);
app.use('/api', reviewRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api', messageRouter);
app.use('/api', payoutRouter)
app.use('/api/service-requests', serviceRequestRouter)
app.use('/api/services', serviceRouter)
app.use('/api/blogs', blogRouter)
app.use('/api/admin', adminRouter)
app.use('/api/complaints', complaintRouter)
app.use('/api/videos', videoRouter)
app.use('/api/follow', FollowRouter)
app.use('/api/contact', ContactRouter)
app.use('/api/verification', VerificationRouter);
app.use('/api/settings', settingRouter)
app.use('/api/about', aboutRouter);

// ↓ error handler
app.use((err, req, res, next) => {
  console.error('ERROR:', err);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: { message: `Upload error: ${err.code}` } });
  }
  res.status(err.status || 500).json({ error: { message: err.message } });
});

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isAllowed =
        allowedOrigins.includes(origin) ||
        /^http:\/\/localhost:\d+$/.test(origin);
      if (isAllowed) return callback(null, true);
      callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  },
});
setupSocket(io);

setInterval(async () => {
  const count = await runAutoReleaseSweep();
  if (count > 0) console.log(`[AUTO-RELEASE] Processed ${count} overdue deals`);
}, 60 * 60 * 1000);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
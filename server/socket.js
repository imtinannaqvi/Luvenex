import { verifyToken } from './lib/jwt.js';
import Message from './models/Message.js';
import Conversation from './models/Conversation.js';
import User from './models/User.js';                       // 👈 needed for sender name
import { scanMessage } from './lib/contentFilter.js';
import { notify } from './services/notification.service.js'; // ⚠️ adjust path if different

export const setupSocket = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token provided'));

    try {
      const decoded = verifyToken(token, process.env.JWT_ACCESS_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: user ${socket.userId}`);

    // 👇 personal room so notifications can be pushed to this specific user
    socket.join(socket.userId);

    socket.on('join_conversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`User ${socket.userId} joined room ${conversationId}`);
    });

    socket.on('send_message', async (data, callback) => {
      try {
        const { conversationId, body } = data;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return callback?.({ error: 'Conversation not found' });

        const isParticipant = conversation.participants.some(
          p => p.toString() === socket.userId
        );
        if (!isParticipant) return callback?.({ error: 'Not authorized' });

        const { flagged, reasons } = scanMessage(body);

        const message = await Message.create({
          conversationId,
          senderId: socket.userId,
          body,
          isFlagged: flagged,
          flagReasons: reasons,
        });

        conversation.lastMessageAt = new Date();
        conversation.lastMessagePreview = body.slice(0, 100);
        await conversation.save();

        if (flagged) {
          console.warn(`[FLAGGED MESSAGE] User ${socket.userId} in ${conversationId}: ${reasons.join(', ')}`);
        }

        const populated = await message.populate('senderId', 'name');

        // Live message delivery — event name aligned with the frontend
        // (it listens for "new_messages") and shape matches the REST path.
        io.to(conversationId).emit('new_messages', {
          ...populated.toObject(),
          conversationId: conversation._id.toString(),
        });

        // ── Notify the OTHER participant (DB row + instant push) ──
        try {
          const recipientId = conversation.participants.find(
            p => p.toString() !== socket.userId
          );
          if (recipientId) {
            const senderName = populated.senderId?.name || 'someone';
            const title = `New message from ${senderName}`;
            const preview = (body || '').slice(0, 80);

            // notify(userId, type, title, message, relatedId) — positional
            await notify(recipientId, 'new_message', title, preview, conversation._id);

            io.to(recipientId.toString()).emit('notification', {
              type: 'new_message',
              title,
              message: preview,
              relatedId: conversation._id.toString(),
            });
          }
        } catch (notifyErr) {
          console.warn('message notify failed:', notifyErr.message);
        }

        callback?.({ success: true, message: populated });
      } catch (err) {
        callback?.({ error: err.message });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: user ${socket.userId}`);
    });
  });
};
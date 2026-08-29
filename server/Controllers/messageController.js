import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { scanMessage } from "../lib/contentFilter.js";
import { uploadAttachment } from "../middleware/upload.js";
import { notify } from "../services/notification.service.js";

export const startConversation = async (req, res) => {
  try {
    const { otherUserId, dealId, gigId } = req.body;
    if (!otherUserId) {
      return res
        .status(400)
        .json({ error: { message: "otherUserId is required" } });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, otherUserId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, otherUserId],
        dealId,
        relatedGigId: gigId,
      });
    }

    res.status(201).json({ conversation });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const getMyConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate("participants", "name role")
      .sort({ lastMessageAt: -1 });
    res.json({ conversations });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const getMessages = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation)
      return res
        .status(404)
        .json({ error: { message: "conversation not found" } });

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant)
      return res.status(403).json({ error: { message: "Not Authorized" } });

    // Opening the thread marks the OTHER person's messages as read.
    // This is what makes the sidebar unread count drop back down.
    await Message.updateMany(
      {
        conversationId: req.params.id,
        senderId: { $ne: req.user._id },
        isRead: false,
      },
      { $set: { isRead: true } }
    );

    const messages = await Message.find({ conversationId: req.params.id })
      .populate("senderId", "name")
      .sort({ createdAt: 1 }); // oldest first for normal reading order

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

// GET /api/messages/unread-count → { count }
export const getUnreadCount = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    }).select("_id");

    const ids = conversations.map((c) => c._id);

    const count = await Message.countDocuments({
      conversationId: { $in: ids },
      senderId: { $ne: req.user._id },
      isRead: false,
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation)
      return res
        .status(404)
        .json({ error: { message: "conversation not Found" } });

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant)
      return res.status(403).json({ error: { message: "Not authorized" } });

    const { body } = req.body;
    if (!body)
      return res
        .status(400)
        .json({ error: { message: "Message body is Required" } });

    const { flagged, reasons } = scanMessage(body);

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: req.user._id,
      body,
      isFlagged: flagged,
      flagReasons: reasons,
    });

    conversation.lastMessageAt = new Date();
    conversation.lastMessagePreview = body.slice(0, 100);
    await conversation.save();

    if (flagged) {
      console.warn(
        `[FLAGGED MESSAGE] User ${req.user._id} in conversation ${conversation._id}: ${reasons.join(
          ", "
        )}`
      );
    }

    // Notify the recipient → drives the toast + bell entry.
    await notifyRecipient(req, conversation, req.user, body);

    const populated = await message.populate("senderId", "name");

    // Realtime delivery (parity with sendAttachment).
    try {
      const io = req.app.get("io");
      if (io) {
        io.to(conversation._id.toString()).emit("new_messages", {
          ...populated.toObject(),
          conversationId: conversation._id.toString(),
        });
      }
    } catch (emitErr) {
      console.warn("Socket emit failed for message:", emitErr.message);
    }

    res.status(201).json({ message: populated });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const getFlaggedMessages = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: { message: "Admin only" } });
    }

    const messages = await Message.find({ isFlagged: true })
      .populate("senderId", "name role")
      .populate("conversationId")
      .sort({ createdAt: -1 });

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const sendAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: "A file is required" } });
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation)
      return res
        .status(404)
        .json({ error: { message: "Conversation not found" } });

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant)
      return res.status(403).json({ error: { message: "Not authorized" } });

    let attachmentType = "pdf";
    if (req.file.mimetype.startsWith("image/")) attachmentType = "image";
    if (req.file.mimetype.startsWith("video/")) attachmentType = "video";

    const attachmentUrl = `/uploads/attachments/${req.file.filename}`;

    const defaultLabel =
      attachmentType === "image"
        ? "📷 Photo"
        : attachmentType === "video"
        ? "🎥 Video"
        : "📄 Document";

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: req.user._id,
      body: req.body.caption?.trim() || defaultLabel,
      attachmentUrl,
      attachmentType,
    });

    conversation.lastMessageAt = new Date();
    conversation.lastMessagePreview = defaultLabel;
    await conversation.save();

    // Notify the recipient of the attachment too.
    await notifyRecipient(req, conversation, req.user, defaultLabel);

    const populated = await message.populate("senderId", "name role");

    try {
      const io = req.app.get("io");
      if (io) {
        io.to(conversation._id.toString()).emit("new_messages", {
          ...populated.toObject(),
          conversationId: conversation._id.toString(),
        });
      }
    } catch (emitErr) {
      console.warn("Socket emit failed for attachment message:", emitErr.message);
    }

    res.status(201).json({ message: populated });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

// Creates a notification for the OTHER participant and (best-effort)
// pushes it live to their personal socket room so the bell/toast update
// instantly instead of waiting for the next poll.
async function notifyRecipient(req, conversation, sender, preview) {
  try {
    const recipientId = conversation.participants.find(
      (p) => p.toString() !== sender._id.toString()
    );
    if (!recipientId) return;

    const title = `New message from ${sender.name || "someone"}`;
    const message = (preview || "").slice(0, 80);

    // notify(userId, type, title, message, relatedId) — positional args.
    await notify(
      recipientId,
      "new_message",
      title,
      message,
      conversation._id
    );

    // Optional real-time push (requires the recipient to be joined to a
    // room named by their user id). Safe no-op if io isn't available.
    try {
      const io = req.app.get("io");
      if (io) {
        io.to(recipientId.toString()).emit("notification", {
          type: "new_message",
          title,
          message,
          relatedId: conversation._id.toString(),
        });
      }
    } catch (emitErr) {
      console.warn("Socket emit failed for notification:", emitErr.message);
    }
  } catch (e) {
    console.warn("message notify failed:", e.message);
  }
}
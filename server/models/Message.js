import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    flagReasons: [{ type: String }],
    attachmentUrl: { type: String },
    attachmentType: { type: String, enum: ["image", "video", "pdf"] },
  },
  { timestamps: true }
);

// Speeds up the unread-count query (conversationId + senderId + isRead).
messageSchema.index({ conversationId: 1, senderId: 1, isRead: 1 });

export default mongoose.models.Message ||
  mongoose.model("Message", messageSchema);
import {
  getMessages,
  getMyConversations,
  startConversation,
  getFlaggedMessages,
  sendMessage,
  sendAttachment,
  getUnreadCount,
} from "../Controllers/messageController.js";
import express from "express";
import { protect } from "../middleware/auth.js";
import { uploadAttachment } from "../middleware/upload.js";

const router = express.Router();

router.post("/conversations", protect, startConversation);
router.get("/conversations", protect, getMyConversations);
router.get("/conversations/:id/messages", protect, getMessages);
router.post("/conversations/:id/messages", protect, sendMessage);

// Static /messages/* routes — keep these above any ":id" style routes.
router.get("/messages/flagged", protect, getFlaggedMessages);
router.get("/messages/unread-count", protect, getUnreadCount);

router.post(
  "/conversations/:id/attachments",
  protect,
  uploadAttachment.single("file"),
  sendAttachment
);

export default router;
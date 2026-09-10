import express from 'express';
import {
  createTicket,
  getMyTickets,
  getTicket,
  addMessage,
  getAllTickets,
  updateTicketStatus,
  deleteTicket,
} from "../Controllers/supportTicketController.js";
import { protect, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get('/mine', protect, getMyTickets);
router.post('/', protect, createTicket);

router.get('/', protect, requireAdmin, getAllTickets);

router.get('/:id', protect, getTicket);          
router.post('/:id/messages', protect, addMessage); 

router.patch('/:id', protect, requireAdmin, updateTicketStatus);
router.delete('/:id', protect, requireAdmin, deleteTicket);

export default router;
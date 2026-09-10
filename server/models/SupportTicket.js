import mongoose from 'mongoose';
import Counter from './Counter.js';

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // 'user' = whoever raised the ticket, 'admin' = support team
  senderRole: { type: String, enum: ['user', 'admin'], required: true },
  body: { type: String, required: true, trim: true, maxlength: 4000 },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const supportTicketSchema = new mongoose.Schema({
  // Sequential human reference: TKT-00001, TKT-00002...
  ticketNumber: { type: String, unique: true, index: true },

  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, required: true, trim: true, maxlength: 4000 },

  category: {
    type: String,
    enum: ['payment', 'deal', 'account', 'technical', 'other'],
    default: 'other',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open',
  },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdByRole: { type: String, enum: ['brand', 'influencer'], required: true },

 
  messages: { type: [messageSchema], default: [] },


  awaitingAdminReply: { type: Boolean, default: true },

  resolvedAt: { type: Date, default: null },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

supportTicketSchema.index({ createdBy: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1, createdAt: -1 });


supportTicketSchema.pre('validate', async function () {
  if (this.ticketNumber) return;
  const seq = await Counter.next('supportTicket');
  this.ticketNumber = `TKT-${String(seq).padStart(5, '0')}`;
});

export default mongoose.models.SupportTicket || mongoose.model('SupportTicket', supportTicketSchema);
import SupportTicket from "../models/SupportTicket.js";

const CATEGORIES = ['payment', 'deal', 'account', 'technical', 'other'];
const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];


export const createTicket = async (req, res) => {
    try {
        const { title, description, category, priority } = req.body;

        if (!title?.trim()) {
            return res.status(400).json({ error: { message: 'Title is required' } });
        }
        if (!description?.trim()) {
            return res.status(400).json({ error: { message: 'Description is required' } });
        }
        if (category && !CATEGORIES.includes(category)) {
            return res.status(400).json({ error: { message: 'Invalid category' } });
        }
        if (priority && !PRIORITIES.includes(priority)) {
            return res.status(400).json({ error: { message: 'Invalid priority' } });
        }

        const openCount = await SupportTicket.countDocuments({
            createdBy: req.user._id,
            status: { $in: ['open', 'in_progress'] },
        });
        if (openCount >= 10) {
            return res.status(429).json({
                error: { message: 'You already have 10 open tickets. Please wait for a reply.' },
            });
        }

        const ticket = await SupportTicket.create({
            title: title.trim(),
            description: description.trim(),
            category: category || 'other',
            priority: priority || 'medium',
            createdBy: req.user._id,
            createdByRole: req.user.role,
        });

        res.status(201).json({ ticket });
    } catch (error) {
        res.status(500).json({ error: { message: error.message } });
    }
};

export const getMyTickets = async (req, res) => {
    try {
        const tickets = await SupportTicket.find({ createdBy: req.user._id })
            .sort({ updatedAt: -1 })
            .lean();
        res.json({ tickets });
    } catch (error) {
        res.status(500).json({ error: { message: error.message } });
    }
};


export const getTicket = async (req, res) => {
    try {
        const ticket = await SupportTicket.findById(req.params.id)
            .populate('createdBy', 'name email role')
            .populate('messages.senderId', 'name role');

        if (!ticket) {
            return res.status(404).json({ error: { message: 'Ticket not found' } });
        }

        const isOwner = ticket.createdBy._id.toString() === req.user._id.toString();
        if (!isOwner && req.user.role !== 'admin') {
            return res.status(403).json({ error: { message: 'Not your ticket' } });
        }

        res.json({ ticket });
    } catch (error) {
        res.status(500).json({ error: { message: error.message } });
    }
};

export const addMessage = async (req, res) => {
    try {
        const { body } = req.body;
        if (!body?.trim()) {
            return res.status(400).json({ error: { message: 'Message is required' } });
        }

        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ error: { message: 'Ticket not found' } });
        }

        const isAdmin = req.user.role === 'admin';
        const isOwner = ticket.createdBy.toString() === req.user._id.toString();
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: { message: 'Not your ticket' } });
        }
        if (ticket.status === 'closed') {
            return res.status(400).json({ error: { message: 'This ticket is closed' } });
        }

        ticket.messages.push({
            senderId: req.user._id,
            senderRole: isAdmin ? 'admin' : 'user',
            body: body.trim(),
        });

        if (isAdmin) {
            ticket.awaitingAdminReply = false;
            if (ticket.status === 'open') ticket.status = 'in_progress';
        } else {
            ticket.awaitingAdminReply = true;
            if (ticket.status === 'resolved') ticket.status = 'in_progress';
        }

        await ticket.save();
        const populated = await ticket.populate('messages.senderId', 'name role');

        res.json({ ticket: populated });
    } catch (error) {
        res.status(500).json({ error: { message: error.message } });
    }
};


export const getAllTickets = async (req, res) => {
    try {
        const filter = {};
        if (req.query.status && STATUSES.includes(req.query.status)) {
            filter.status = req.query.status;
        }
        if (req.query.category && CATEGORIES.includes(req.query.category)) {
            filter.category = req.query.category;
        }

        const tickets = await SupportTicket.find(filter)
            .populate('createdBy', 'name email role')
            .sort({ awaitingAdminReply: -1, updatedAt: -1 })
            .lean();

        const counts = {
            open: await SupportTicket.countDocuments({ status: 'open' }),
            in_progress: await SupportTicket.countDocuments({ status: 'in_progress' }),
            resolved: await SupportTicket.countDocuments({ status: 'resolved' }),
            closed: await SupportTicket.countDocuments({ status: 'closed' }),
        };

        res.json({ tickets, counts });
    } catch (error) {
        res.status(500).json({ error: { message: error.message } });
    }
};

export const updateTicketStatus = async (req, res) => {
    try {
        const { status, priority } = req.body;

        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ error: { message: 'Ticket not found' } });
        }

        if (status !== undefined) {
            if (!STATUSES.includes(status)) {
                return res.status(400).json({ error: { message: 'Invalid status' } });
            }
            ticket.status = status;
            if (status === 'resolved' || status === 'closed') {
                ticket.resolvedAt = new Date();
                ticket.resolvedBy = req.user._id;
                ticket.awaitingAdminReply = false;
            } else {
                ticket.resolvedAt = null;
                ticket.resolvedBy = null;
            }
        }

        if (priority !== undefined) {
            if (!PRIORITIES.includes(priority)) {
                return res.status(400).json({ error: { message: 'Invalid priority' } });
            }
            ticket.priority = priority;
        }

        await ticket.save();
        res.json({ ticket });
    } catch (error) {
        res.status(500).json({ error: { message: error.message } });
    }
};

export const deleteTicket = async (req, res) => {
    try {
        const deleted = await SupportTicket.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: { message: 'Ticket not found' } });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: { message: error.message } });
    }
};
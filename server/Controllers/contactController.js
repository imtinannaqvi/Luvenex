import ContactMessage from "../models/ContactMessage.js";

export const submitContactMessage = async (req, res) => {
    try {
        const {name, email,message,category} = req.body;
        if(!name || !message || !email) return res.status(400).json({error:{message:"Name, Email, and message are required"}})
        
            const contactMessage = await ContactMessage.create({
                name,
                email,
                category: category || 'general',
                message,
                userId: req.user?._id
            });
            res.status(201).json({message:"Message created successfully", contactMessage})
    } catch (error) {
        res.status(500).json({ error:{message: error.message}})
        
    }
}

export const getContactMessages = async(req, res) => {
    try {
        const filter = {};
        if(req.query.status) filter.status = req.query.status;
        if(req.query.category) filter.category = req.query.category;
        const messages = await ContactMessage.find(filter)
        .populate("userId","name email role")
        .sort({ createdAt: -1})
        res.json({ messages})
    } catch (error) {
        res.status(500).json({error:{message: error.message}})
    }
}

export const updateContactMessageStatus = async(req, res) => {
    try {
        const {status} = req.body;
        if(!['new','read','resolved'].includes(status)) {
            return res.status(400).json({error:{message:"Invalid status"}})
        }
        const contactMessage = await ContactMessage.findByIdAndUpdate(
            req.params.id,
            {status},
            {new:true},
        );
        if(!contactMessage){
            return res.status(404).json({error:{message:"Message not found"}})
        }
        res.json({ contactMessage})
    } catch (error) {
        res.status(500).json({error:{message: error.message}})
        
    }
}
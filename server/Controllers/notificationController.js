import Notification from "../models/Notification.js";

export const getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({userId: req.user._id})
        .sort({ createdAt: -1})
        res.json({ notifications})
    } catch (error) {
        res.status(500).json({error:{ message: error.message}})
        
    }
}

export const markAsRead = async (req,res) => {
    try {
        const notification = await Notification.findById(req.params.id)
        if(!notification) return res.status(404).json({error:{message:'Notification not found'}})
            if(notification.userId.toString() !== req.user._id.toString()) {
                return res.status(403).json({error: {message:'Not Authorized '}})
            }

            notification.isRead = true;
            await notification.save();
            res.json({ notification});

    } catch (error) {
        res.status(500).json({error:{ message: error.message}})

        
    }
}

export const masrkAllRead = async (req,res) => {
    try {
        await Notification.updateMany({userId: req.user._id, isRead: false}, {isRead:false})
        res.json({message:"All Notification mark asRead"})
    } catch (error) {
        res.status(500).json({error:{message:error.message}})
        
    }
}
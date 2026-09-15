import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    }],
    dealId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Deal"
    },
    relatedGigId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig' },
    lastMessageAt:{
        type:Date,
        default: Date.now
    },
    lastMessagePreview:{
        type:String
    },
   
    initiatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    status: {
        type: String,
        enum: ["pending", "accepted"],
        default: "accepted"
    }
},{timestamps:true})

export default mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema)
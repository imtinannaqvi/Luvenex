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
    lastMessageAt:{
        type:Date,
        default: Date.now

    },
    lastMessagePreview:{
        type:String
    }
},{timestamps:true})

export default mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema)
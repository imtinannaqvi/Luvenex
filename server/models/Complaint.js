import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema({
    dealId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Deal",
        required:true
    },
    filedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    against:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    reason:{
        type:String,
        enum:[
            'no_response',
            'poor_communication',
            'unfair_rejection',
            'others'
        ],
        default:'no_response',
    },
    description:{
        type:String,
        required:true
    },
    status:{
        type:String,
        enum:[
            'open','reviewed','dismissed'
        ],
        default:'open'
    },
    adminNotes:{
        type:String
    }
    
},{timestamps:true})

export default mongoose.models.Complaint || mongoose.model('Complaint', complaintSchema)
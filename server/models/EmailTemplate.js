import mongoose, { Schema } from "mongoose";

const emailTemplateSchema = new mongoose.Schema({
    key:{
        type: String,
        unique:true,
        index:true,
        required:true
    },
    subject:{
        type:String,
        trim:true,
        required:true,
        maxLength:200,
    },
    body:{
        type:String,
        required:true,
        maxLength:20000
        
    },
    isActive:{
        type:Boolean,
        default:true,
    },
     updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
 
export default mongoose.models.EmailTemplate || mongoose.model('EmailTemplate', emailTemplateSchema);


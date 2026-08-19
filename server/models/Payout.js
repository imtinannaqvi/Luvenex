import mongoose from "mongoose";

const payoutSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    amountMinor:{
        type:Number,
        required:true
    },
    method:{
        type:String,
        enum:[
            'bank_transfer','easyPaisa','Jazzcash'
        ],
        required:true
    },
    accountDetails:{
        accountTitle:String,
        accountNumber:String,
        bankName:String
    },
    status:{
        type:String,
        enum:[
            'pending','completed','processing','rejected'
        ],
        default:'pending',
    },
    rejectionReason:{
        type:String
    },
},{timestamps:true})

export default mongoose.models.Payout || mongoose.model('Payout', payoutSchema)
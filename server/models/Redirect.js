import mongoose from "mongoose";

const redirectSchema = new mongoose.Schema({
    form: {
        type:String,
        required:true,
        unique:true,
        trim:true,
        maxLength:400,
    },
    to:{
        type:String,
        required:true,
        trim:true,
        maxLength:400
    },
    type:{
        type:Number,
        enum:[
            301,302
        ],
        default:301
    },
    isActive:{
        type:Boolean,
        default:true

    },
    hit:{
        type:Number,
        default:0
    },
    lastHitAt:{
        type:Date,
        default:null

    },
    createBy:{
        type:mongoose.Schema.Types.ObjectId, ref:"User"
    }
},{timestamps:true})

export default mongoose.models.Redirect || mongoose.model('Redirect', redirectSchema)
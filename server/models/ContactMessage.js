import mongoose from 'mongoose'

const contactMessageSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true

    },
    email:{
        type:String,
        required:true
    },
    category:{
        type:String,
        enum:[
            'general','support','partnerShip','press'
        ],
        default:"general"
    },
    message:{
        type:String,
        required:true
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    status:{
        type:String,
        enum:[
            "new","read","resolved"
        ],
        default:"new"
    },
},{timestamps:true})

export default mongoose.models.ContactMessage || mongoose.model("ContactMessage", contactMessageSchema)
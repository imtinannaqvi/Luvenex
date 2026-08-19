import mongoose from "mongoose";

const aboutPageSchema = new mongoose.Schema({
    title:{
        type:String,
        default:"About Luvenex"
    },
    content:{
        type:String,
        default:""
    },
    heroImage:{
        type:String
    },
    updatedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },

},{timestamps:true})

aboutPageSchema.statics.getContent = async function () {
    let page = await this.findOne();
    if (!page) {
        page = await this.create({});
    }
    return page;
};

export default mongoose.models.AboutPage || mongoose.model("AboutPage", aboutPageSchema)
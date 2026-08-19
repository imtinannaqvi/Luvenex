import mongoose from "mongoose";

const videoCommentSchema = new mongoose.Schema({
    videoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    body: {
        type: String,
        required: true,
        maxlength: 500,
    },
    parentCommentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "VideoComment",
        default: null
    }
}, { timestamps: true })

export default mongoose.models.VideoComment || mongoose.model('VideoComment', videoCommentSchema)
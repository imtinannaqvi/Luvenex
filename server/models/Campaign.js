import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema({
    brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title:{
    type:String,
    required:true
  },
  goals:{
    type:String
  },
  description:{
    type:String
  },
  budgetMinMinor:{
    type:Number
  },
  budgetMaxMinor:{
    type:Number
  },
  criteriaJson: { type: mongoose.Schema.Types.Mixed }, 
  category: { type: String },
  deadline: { type: Date },
status: {
  type: String,
  enum: ['open', 'closed', 'draft', 'cancelled'],
  default: 'open',
},
  moderationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved', 
  },
  deliverablesJson: { type: mongoose.Schema.Types.Mixed },
}, {timestamps:true})

export default mongoose.models.Campaign || mongoose.model('Campaign', campaignSchema)
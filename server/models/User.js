import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phone: {
    type: String
  },
  passwordHash: {
    type: String,
    required: true
  },
  kyc:{
    status:{
        type:String,
        enum:[
            'not_submitted','pending','verified','rejected'
        ],
        default:'not_submitted'
    },
   cnicNumber:{
    type: String
   },
   fullName:{
    type:String
   },
   submittedAt:{
    type:Date
   },
   reviewedAt:{
    type: Date
   },
   rejectionReason:{
    type:String
   },
   cnicFrontUrl: {
  type: String
},
cnicBackUrl: {
  type: String
},
  },
  agreedToTermsAt: { type: Date },
  role: {
    type: String,
    enum: ["brand", "admin", "influencer"],
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "active", "suspended", "banned",'deactivated'],
    default: 'pending'
  },
statusReason: { type: String },       
statusChangedAt: { type: Date }, 
  emailVerifiedAt: {
    type: Date          
  },
  referralCode: {        
    type: String
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  referralRewardsEarnedMinor:{
    type:Number,
    default:0
  },

  privacySettings: {
    hideFromSearch:{
      type:Boolean,
      default:false
    },
    hideActivity: {
      type:Boolean,
      default:false
    }

  },
  verificationRequest: {
  status: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none',
  },
  reason: { type: String },      
  submittedAt: { type: Date },
  reviewedAt: { type: Date },
  rejectionReason: { type: String },
},
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);  
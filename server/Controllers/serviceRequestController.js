import ServiceRequest from "../models/ServiceRequest.js";
import Conversation from "../models/Conversation.js";
import { notify } from "../services/notification.service.js";

export const createServiceResquest = async (req, res) => {
    try {
if(req.user.role !== 'brand') {
                return res.status(403).json({error:{message:"Only brands can submit service request"}})
        }
        const {title, description, budgetMinMinor, budgetMaxMinor, deadline,category,serviceId} = req.body;
        if(!title || !description) {
            return res.status(400).json({error:{ message:'Title and Description are required'}})
        }
     const request = await ServiceRequest.create({
  brandId: req.user._id,
  serviceId,
  title,
  description,
  category,
  deadline,
  budgetMinMinor,
  budgetMaxMinor,
  status: 'pending',   // ✅ lowercase, matches the enum
});

        res.status(201).json({ request})

    } catch (error) {
        res.status(500).json({error: {message: error.message}})
        
    }
}

export const getMyServiceRequests = async (req,res) => {
    try {
        const requests  = await ServiceRequest.find({ brandId: req.user._id})
        .populate('matchedInfluencerId', 'name')
        .populate('serviceId', 'title')
        .sort({ createdAt: -1})
        res.json({ requests})
    } catch (error) {
        res.status(500).json({ error:{ message: error.message}})
        
    }
}

export const getAllServiceRequest = async (req,res) => {
    try {
if(req.user.role !== 'admin') {
                return res.status(403).json({error:{message:'Only Admin'}})
        }
        const filter = {};
        if(req.query.status) filter.status = req.query.status;

        const requests = await ServiceRequest.find(filter)
        .populate('brandId', 'name email')
        .populate('matchedInfluencerId', 'name email')
        .sort({ createdAt: -1})

        res.json({ requests})
    } catch (error) {
        res.status(500).json({error: {message:error.message}})
        
    }
}

export const matchServiceRequest = async (req,res) => {
    try {
        if(req.user.role !== 'admin') {
            return res.status(403).json({error: { message:'Only Amdin'}})
        }
    const {influencerId, adminNotes } = req.body;
    if(!influencerId) {
        return res.status(400).json({error:{message:"Influencer is required"}})
    }
    const request = await ServiceRequest.findById(req.params.id);
    if(!request) return res.status(404).json({error:{message:'Service Request not Found'}})
if( request.status !== 'pending') {
                return res.status(400).json({error: {message:`Request is already ${request.status}`}})
        }

         let conversation = await Conversation.findOne({
      participants: { $all: [request.brandId, influencerId] },
    });
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [request.brandId, influencerId],
      });
    }

    request.status = 'matched';
    request.matchedInfluencerId = influencerId;
    request.matchedAt = new Date();
    request.conversationId = conversation._id;
    if (adminNotes) request.adminNotes = adminNotes;
    await request.save();

    await notify(
      request.brandId,
      'service_matched',
      'You have been matched!',
      `Luvenex matched your request "${request.title}" with an influencer. Start chatting now.`,
      request._id
    );
    await notify(
      influencerId,
      'service_matched',
      'New opportunity from Luvenex',
      `A brand's request "${request.title}" was matched with you. Start chatting now.`,
      request._id
    );

    res.json({ request });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

export const cancleServiceRequest = async (req,res) => {
    try {
        const request  = await ServiceRequest.findById(req.params.id)
        if(!request) {
            return res.status(404).json({error:{message:"Service Request is not Found"}})
        }

if(request.brandId.toString() !== req.user._id.toString()) {
                return res.status(403).json({error:{message:'Not Authorized'}})
        }

        if(request.status !== 'pending' ) {
            return res.status(400).json({error:{message:'Only pending requests can be Cancelled'}})
        }
        request.status = 'cancelled'
        await request.save();

        res.json({ request})
    } catch (error) {
        res.status(500).json({error:{message: error.message}})
        
    }
}

export const closeServiceRequest = async (req,res) => {
    try {

       if(req.user.role !== 'admin') {
            return res.status(403).json({error: { message:'Only Amdin'}})
        }

           const request  = await ServiceRequest.findById(req.params.id)
        if(!request) {
            return res.status(404).json({error:{message:"Service Request is not Found"}})
        }

       request.status = 'closed'
        await request.save();
        res.json({ request });
        
    } catch (error) {
        res.status(500).json({error:{message:error.message}})
        
    }
}

   
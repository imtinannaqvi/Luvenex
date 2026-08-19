import Complaint from "../models/Complaint.js";
import Deal from "../models/Deal.js";


export const fileComplaint = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ error: { message: "Deal not found" } });

    if (deal.influencerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: "Only the influencer on this deal can file a complaint" } });
    }
    if (deal.status !== 'auto_released') {
      return res.status(400).json({ error: { message: "Complaints can only be filed on an auto-released deal" } });
    }

    const { reason, description } = req.body;
    if (!description) {
      return res.status(400).json({ error: { message: "Description is required" } });
    }

    const complaint = await Complaint.create({
      dealId: deal._id,
      filedBy: req.user._id,
      against: deal.brandId,
      reason: reason || 'no_response',
      description,
    });

    res.json({ complaint });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: { message: "You already filed a complaint for this deal" } });
    }
    res.status(500).json({ error: { message: error.message } });
  }
};
export const getComplaints = async (req,res) => {
    try {
        if(req.user.role !== 'admin') {
            return res.status(403).json({error:{message:"admin only"}})
        }
        const filter = {};
        if(req.query.status) filter.status = req.query.status;
        if(req.query.against) filter.against = req.query.against;

        const complaints = await Complaint.find(filter)
        .populate('filedBy','name email')
        .populate('against', 'name email')
        .populate('dealId', 'title priceMinor')
        .sort({ createdAt: -1})

        res.json({ complaints})
    } catch (error) {
        res.status(500).json({ error:{message: error.message}})
        
    }
}

export const getComplaintsAgainstUser = async (req,res) => {
    try {
        if(req.user.role !== 'admin') {
            return res.status(403).json({ error:{message:"admin only"}})
        }

        const complaints = await Complaint.find({against: req.params.userId})
        .populate('filedBy', 'name email')
        .sort({ createdAt: -1})

        res.json({ complaints, count: complaints.length});

    } catch (error) {
        res.status(500).json({error:{message: error.message}})
        
    }
}

export const reviewComplaint = async (req,res) => {
    try {
        if(req.user.role !== 'admin') {
            return res.status(403).json({error:{message:'admin only '}})
        }
        const { status, adminNotes} = req.body;
        if(!['reviewed', 'dismissed'].includes(status)) {
            return res.status(400).json({ error:{message:'status must be reviewed or dismissed'}})
        }
        const complaint = await Complaint.findById(req.params.id) ;
        if(!complaint) return res.status(404).json({error:{message:'complaint not found'}})
            complaint.status = status;
        if(adminNotes) complaint.adminNotes = adminNotes;
        await complaint.save();
    } catch (error) {
        res.status(500).json({ error:{message: error.message}})
        
    }
}


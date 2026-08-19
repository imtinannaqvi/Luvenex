import Service from "../models/Service.js";
import fs from 'fs';

const deleteFile = (urlPath) => {
    if(!urlPath) return;
    const p = `.${urlPath}`;
    if(fs.existsSync(p)) fs.unlinkSync(p)

};

export const createService = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Admin only' } });
    }

    const { title, shortDescription, description, category, priceMinor } = req.body;
    if (!title || !shortDescription || !description) {
      return res.status(400).json({ error: { message: 'title, shortDescription, and description are required' } });
    }

    // multer (fields mode) puts files on req.files as { cover: [...], gallery: [...], videos: [...] }
    const coverImage = req.files?.cover?.[0]
      ? `/uploads/services/${req.files.cover[0].filename}`
      : undefined;
    const additionalImages = (req.files?.gallery || []).map(f => `/uploads/services/${f.filename}`);
    const videos = (req.files?.videos || []).map(f => `/uploads/services/${f.filename}`);
    const iconUrl = req.files?.icon?.[0]
  ? `/uploads/services/${req.files.icon[0].filename}`
  : undefined;

   const service = await Service.create({
  title,
  shortDescription,
  description,
  category,
  priceMinor: priceMinor ? Number(priceMinor) : undefined,
  coverImage,
  additionalImages,
  videos,
  iconUrl,   // ✅ add this
  createdBy: req.user._id,
});

    res.status(201).json({ service });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

export const getServices = async (req,res) => {
    try {

        const filter = {isActive: true}
        if(req.query.category) filter.category = req.query.category;


        const services = await Service.find(filter)
        .select('-createdBy')
        .sort({ createdAt: -1})

        res.json({ services})
    } catch (error) {
        res.status(500).json({error:{message: error.message}})
        
    }
}

export const getServiceById = async (req,res) => {
    try {
        const service = await Service.findById(req.params.id)
        if(!service || !service.isActive) {
            return res.status(404).json({error:{message:'Service not Found'}})
        }
        res.json({ service})
    } catch (error) {
        res.status(500).json({error:{message: error.message}})
        
    }
}

export const updateService = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Admin only' } });
    }

    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ error: { message: 'Service not found' } });

    // text fields
    const allowed = ['title', 'shortDescription', 'description', 'category', 'priceMinor', 'isActive'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) service[key] = req.body[key];
    }
    

    if (req.files?.cover?.[0]) {
      deleteFile(service.coverImage);
      service.coverImage = `/uploads/services/${req.files.cover[0].filename}`;
    }

    if (req.files?.gallery?.length) {
      service.additionalImages.push(...req.files.gallery.map(f => `/uploads/services/${f.filename}`));
    }
    if (req.files?.videos?.length) {
      service.videos.push(...req.files.videos.map(f => `/uploads/services/${f.filename}`));
    }
    if (req.files?.icon?.[0]) {
  deleteFile(service.iconUrl);
  service.iconUrl = `/uploads/services/${req.files.icon[0].filename}`;
}

    await service.save();
    res.json({ service });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

export const removeServiceMedia = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Admin only' } });
    }

    const { mediaUrl } = req.body;  
    if (!mediaUrl) return res.status(400).json({ error: { message: 'mediaUrl is required' } });

    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ error: { message: 'Service not found' } });

    service.additionalImages = service.additionalImages.filter(u => u !== mediaUrl);
    service.videos = service.videos.filter(u => u !== mediaUrl);
    deleteFile(mediaUrl);

    await service.save();
    res.json({ service });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};

export const deleteService = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Admin only' } });
    }

    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ error: { message: 'Service not found' } });

    deleteFile(service.coverImage);
    service.additionalImages.forEach(deleteFile);
    service.videos.forEach(deleteFile);

    await service.deleteOne();
    res.json({ message: 'Service deleted' });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};
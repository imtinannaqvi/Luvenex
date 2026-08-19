import AboutPage from "../models/AboutPage.js";
import fs from 'fs'
export const getAboutPage = async(req,res) => {
    try {
        const page = await AboutPage.getContent()
        res.json({ page})
    } catch (error) {
        console.error(error);
        res.status(500).json({ error:{message: error.message}})
        
    }
}

export const updateAboutPage = async(req,res) => {
    try {
        if(req.user.role !== 'admin') {
            return res.status(403).json({error:{message:'Admin Only'}})
        }
        const page = await AboutPage.getContent();
        const {title,content} = req.body;
        if(title !== undefined) page.title = title;
        if(content !== undefined) page.content = content;

        if(req.file) {
            if(page.heroImage) {
                const oldPath = `.${page.heroImage}`;
                if(fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
            }
         page.heroImage = `/uploads/about/${req.file.filename}`;
        };

        page.updatedBy = req.user._id;
        await page.save();

        res.json({ page})

        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error:{ message: error.message}})
        
    }
}
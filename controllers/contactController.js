const DescriptionSchema = require('../models/descriptionSchema');
const { createDescription } = require('../factory/factory');
const { zip } = require('../utils/zip');

// GET /admin/contact - Show social descriptions page
module.exports.show = async (req, res) => {
    const iconDescriptions = await DescriptionSchema.find({category: 'Social'}).sort({order:1});
    res.render('admin/edit-contact', {iconDescriptions, admin:true})
};

// POST /admin/contact - Update social descriptions
module.exports.update = async (req, res) => {
    const titleDescriptionPair = zip([req.body.title, req.body.description]);
    await DescriptionSchema.deleteMany({category: 'Social'});
    for(let i = 0; i < titleDescriptionPair.length; i++) {
        const titleDescription = titleDescriptionPair[i];
        if(titleDescription[0] && titleDescription[1]) {
            let title = titleDescription[0];
            if(title.includes("<i class=")) {
                title = title.split("\"")[1];
            }
            const description = createDescription(title, titleDescription[1], 'Social', i);
            await description.save();
        } 
    }
    res.redirect('/admin/contact');
};

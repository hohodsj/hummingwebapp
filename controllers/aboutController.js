const DescriptionSchema = require('../models/descriptionSchema');
const { createDescription } = require('../factory/factory');
const { zip } = require('../utils/zip');

// GET /admin/about - Show CV descriptions page
module.exports.show = async (req, res) => {
    const descriptions = await DescriptionSchema.find({category: 'CV'}).sort({order: 1});
    res.render('admin/edit-about', {descriptions, admin:true});
};

// POST /admin/about - Update CV descriptions
module.exports.update = async (req, res) => {
    const titleDescriptionPair = zip([req.body.title, req.body.description]);
    await DescriptionSchema.deleteMany({category: 'CV'});
    for(let i = 0; i < titleDescriptionPair.length; i++) {
        const titleDescription = titleDescriptionPair[i];
        if(titleDescription[0] && titleDescription[1]) {
            console.log(titleDescription);
            const description = createDescription(titleDescription[0], titleDescription[1], 'CV', i);
            await description.save();
        } 
    }
    res.redirect('/admin/about');
};

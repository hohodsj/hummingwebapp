const CollectionSchema = require('../../models/collectionSchema');
const ArtWorkSchema = require('../../models/artworkSchema');
const DescriptionSchema = require('../../models/descriptionSchema');

async function seedCollection({ name = 'TestCollection', isHide = false, order = 0 } = {}) {
   const description = await new DescriptionSchema({
       title: name,
       description: `Description for ${name}`,
       category: 'Collection',
       order: 0,
   }).save();

   const cover = await new ArtWorkSchema({
       thumbnailId: `thumb-${name}`,
       imageId: `img-${name}`,
       fileName: 'cover.jpg',
       isHorizontal: true,
       order: -1,
       createDate: new Date(),
   }).save();

   const artwork1 = await new ArtWorkSchema({
       thumbnailId: `art-thumb-1-${name}`,
       imageId: `art-img-1-${name}`,
       fileName: 'artwork1.jpg',
       isHorizontal: true,
       order: 0,
       createDate: new Date(),
   }).save();

   const collection = await new CollectionSchema({
       collectionName: name,
       cover: cover._id,
       order,
       artworks: [artwork1._id],
       description: description._id,
       isHide,
       updateDate: new Date(),
   }).save();

   artwork1.collectionSchema = collection._id;
   cover.collectionSchema = collection._id;
   await artwork1.save();
   await cover.save();

   return { collection, cover, artwork1, description };
}

async function seedCVDescriptions(count = 2) {
   const descriptions = [];
   for (let i = 0; i < count; i++) {
       const d = await new DescriptionSchema({
           title: `CV Title ${i}`,
           description: `CV Description ${i}`,
           category: 'CV',
           order: i,
       }).save();
       descriptions.push(d);
   }
   return descriptions;
}

async function seedSocialDescriptions(count = 2) {
   const descriptions = [];
   for (let i = 0; i < count; i++) {
       const d = await new DescriptionSchema({
           title: `fa-brands fa-icon-${i}`,
           description: `https://example.com/${i}`,
           category: 'Social',
           order: i,
       }).save();
       descriptions.push(d);
   }
   return descriptions;
}

module.exports = { seedCollection, seedCVDescriptions, seedSocialDescriptions };

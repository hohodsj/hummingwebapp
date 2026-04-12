jest.mock('../google/GoogleDriveService', () => require('./helpers/mockGoogleDrive'));
jest.mock('../utils/googleDriveUtil', () => ({
   uploadImageToDrive: jest.fn().mockResolvedValue(['mock-thumb-id', 'mock-img-id', true]),
   downloadImages: jest.fn().mockResolvedValue(undefined),
   deleteImageWithIds: jest.fn().mockResolvedValue(undefined),
   deleteAllImages: jest.fn().mockResolvedValue(undefined),
   searchAllFiles: jest.fn().mockResolvedValue([]),
}));
jest.mock('../utils/coverImgGenerator', () => ({
   generateImageAsync: jest.fn().mockResolvedValue({ data: Buffer.from('fake-image') }),
}));
jest.mock('../utils/uploadCleanup', () => ({
   uploadCleanup: jest.fn(),
}));

require('./setup');
const app = require('../app');
const { getAuthenticatedAgent } = require('./helpers/authHelper');
const { seedCollection } = require('./helpers/seedHelper');
const CollectionSchema = require('../models/collectionSchema');
const ArtWorkSchema = require('../models/artworkSchema');
const DescriptionSchema = require('../models/descriptionSchema');

describe('Admin Collection Routes', () => {
   let agent;

   beforeEach(async () => {
       agent = await getAuthenticatedAgent(app);
   });

   test('GET /admin/collection/:name — renders edit page', async () => {
       await seedCollection({ name: 'EditMe' });
       const res = await agent.get('/admin/collection/EditMe');
       expect(res.status).toBe(200);
       expect(res.text).toContain('EditMe');
   });

   test('POST /admin/update/collection/:id/:name — updates title and description', async () => {
       const { collection } = await seedCollection({ name: 'Original' });
       const res = await agent
           .post(`/admin/update/collection/${collection._id}/Original`)
           .field('title', 'Updated Title')
           .field('description', 'Updated Desc');
       expect(res.status).toBe(302);
       const updated = await CollectionSchema.findById(collection._id).populate('description');
       expect(updated.description.title).toBe('Updated Title');
       expect(updated.description.description).toBe('Updated Desc');
   });

   test('DELETE /admin/collection/:name — removes collection and children', async () => {
       const { collection, cover, artwork1, description } = await seedCollection({ name: 'ToDelete' });
       const res = await agent
           .post('/admin/collection/ToDelete?_method=DELETE');
       expect(res.status).toBe(302);
       expect(await CollectionSchema.findById(collection._id)).toBeNull();
       expect(await ArtWorkSchema.findById(artwork1._id)).toBeNull();
   });

   test('DELETE /admin/artwork/:id — removes artwork from DB', async () => {
       const { collection, artwork1 } = await seedCollection({ name: 'HasArt' });
       const res = await agent
           .post(`/admin/artwork/${artwork1._id}?_method=DELETE`);
       expect(res.status).toBe(302);
       expect(await ArtWorkSchema.findById(artwork1._id)).toBeNull();
   });

   test('DELETE /admin/artwork/:id — updates order of remaining artworks', async () => {
       const { collection } = await seedCollection({ name: 'Reorder' });
       const art2 = await new ArtWorkSchema({
           thumbnailId: 'thumb-2', imageId: 'img-2', fileName: 'art2.jpg',
           isHorizontal: false, order: 1, createDate: new Date(),
           collectionSchema: collection._id,
       }).save();
       await CollectionSchema.updateOne(
           { _id: collection._id },
           { $push: { artworks: art2._id } }
       );

       // Delete the first artwork (order: 0)
       const art1 = await ArtWorkSchema.findOne({
           collectionSchema: collection._id, order: 0, fileName: 'artwork1.jpg'
       });
       await agent.post(`/admin/artwork/${art1._id}?_method=DELETE`);

       const remaining = await ArtWorkSchema.findById(art2._id);
       expect(remaining.order).toBe(0);
   });

   test('PATCH /admin/hide/false/collection/:name — unhides collection', async () => {
       await seedCollection({ name: 'WasHidden', isHide: true, order: -1 });
       const res = await agent
           .post('/admin/hide/false/collection/WasHidden?_method=PATCH')
           .type('form')
           .send({});
       expect(res.status).toBe(302);
       const col = await CollectionSchema.findOne({ collectionName: 'WasHidden' });
       expect(col.isHide).toBe(false);
       expect(col.order).toBeGreaterThanOrEqual(0);
   });
});

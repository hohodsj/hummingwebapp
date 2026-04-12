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

require('./setup');
const app = require('../app');
const { getAuthenticatedAgent } = require('./helpers/authHelper');
const { seedCollection } = require('./helpers/seedHelper');
const CollectionSchema = require('../models/collectionSchema');

describe('Admin Portfolio Routes', () => {
   let agent;

   beforeEach(async () => {
       agent = await getAuthenticatedAgent(app);
   });

   test('GET /admin/portfolio — renders when authenticated', async () => {
       const res = await agent.get('/admin/portfolio');
       expect(res.status).toBe(200);
       expect(res.text).toContain('Showing art works');
   });

   test('GET /admin/portfolio — shows visible collections', async () => {
       await seedCollection({ name: 'MyArt', isHide: false, order: 0 });
       const res = await agent.get('/admin/portfolio');
       expect(res.status).toBe(200);
       expect(res.text).toContain('MyArt');
   });

   test('GET /admin/portfolio — shows hidden collections separately', async () => {
       await seedCollection({ name: 'Public', isHide: false, order: 0 });
       await seedCollection({ name: 'Private', isHide: true, order: -1 });
       const res = await agent.get('/admin/portfolio');
       expect(res.status).toBe(200);
       expect(res.text).toContain('Public');
       expect(res.text).toContain('Private');
       expect(res.text).toContain('Hiding art works');
   });

   test('POST /admin/create-collection — creates new collection in DB', async () => {
       const res = await agent
           .post('/admin/create-collection')
           .type('form')
           .send({ collectionName: 'NewCollection', description: 'Brand new' });
       expect(res.status).toBe(200);
       const col = await CollectionSchema.findOne({ collectionName: 'NewCollection' });
       expect(col).not.toBeNull();
       expect(col.isHide).toBe(false);
   });

   test('POST /admin/create-collection — duplicate name redirects with error', async () => {
       await seedCollection({ name: 'Existing', order: 0 });
       const res = await agent
           .post('/admin/create-collection')
           .type('form')
           .send({ collectionName: 'Existing', description: 'Duplicate' });
       expect(res.status).toBe(302);
       expect(res.headers.location).toBe('/admin/portfolio');
       const count = await CollectionSchema.countDocuments({ collectionName: 'Existing' });
       expect(count).toBe(1);
   });

   test('POST /admin/reorder/portfolio — updates order in DB', async () => {
       await seedCollection({ name: 'First', order: 0 });
       await seedCollection({ name: 'Second', order: 1 });
       const res = await agent
           .post('/admin/reorder/portfolio')
           .type('form')
           .send({ orders: 'Second,First' });
       expect(res.status).toBe(302);
       const first = await CollectionSchema.findOne({ collectionName: 'First' });
       const second = await CollectionSchema.findOne({ collectionName: 'Second' });
       expect(second.order).toBeGreaterThan(first.order);
   });

   test('PATCH /admin/hide/true/collection/:name — hides collection', async () => {
       await seedCollection({ name: 'ToHide', isHide: false, order: 0 });
       const res = await agent
           .post('/admin/hide/true/collection/ToHide?_method=PATCH')
           .type('form')
           .send({});
       expect(res.status).toBe(302);
       const col = await CollectionSchema.findOne({ collectionName: 'ToHide' });
       expect(col.isHide).toBe(true);
       expect(col.order).toBe(-1);
   });
});

jest.mock('../google/GoogleDriveService', () => require('./helpers/mockGoogleDrive'));
jest.mock('../utils/googleDriveUtil', () => ({
   uploadImageToDrive: jest.fn().mockResolvedValue(['mock-thumb-id', 'mock-img-id', true]),
   downloadImages: jest.fn().mockResolvedValue(undefined),
   deleteImageWithIds: jest.fn().mockResolvedValue(undefined),
   deleteAllImages: jest.fn().mockResolvedValue(undefined),
   searchAllFiles: jest.fn().mockResolvedValue([]),
}));

require('./setup');
const app = require('../app');
const { getAuthenticatedAgent } = require('./helpers/authHelper');
const { seedCVDescriptions } = require('./helpers/seedHelper');
const DescriptionSchema = require('../models/descriptionSchema');

describe('Admin About Routes', () => {
   let agent;

   beforeEach(async () => {
       agent = await getAuthenticatedAgent(app);
   });

   test('GET /admin/about — renders edit page with descriptions', async () => {
       await seedCVDescriptions(2);
       const res = await agent.get('/admin/about');
       expect(res.status).toBe(200);
       expect(res.text).toContain('CV Title 0');
   });

   test('GET /admin/about — renders empty when no descriptions', async () => {
       const res = await agent.get('/admin/about');
       expect(res.status).toBe(200);
   });

   test('POST /admin/about — replaces all CV descriptions', async () => {
       await seedCVDescriptions(1); // old data
       const res = await agent
           .post('/admin/about')
           .type('form')
           .send('title=New+A&description=Desc+A&title=New+B&description=Desc+B');
       expect(res.status).toBe(302);
       const descs = await DescriptionSchema.find({ category: 'CV' }).sort({ order: 1 });
       expect(descs).toHaveLength(2);
       expect(descs[0].title).toBe('New A');
       expect(descs[1].title).toBe('New B');
   });

   test('POST /admin/about — skips empty title/description pairs', async () => {
       const res = await agent
           .post('/admin/about')
           .type('form')
           .send('title=Valid&description=Content&title=&description=');
       expect(res.status).toBe(302);
       const descs = await DescriptionSchema.find({ category: 'CV' });
       expect(descs).toHaveLength(1);
       expect(descs[0].title).toBe('Valid');
   });
});

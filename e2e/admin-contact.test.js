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
const { seedSocialDescriptions } = require('./helpers/seedHelper');
const DescriptionSchema = require('../models/descriptionSchema');

describe('Admin Contact Routes', () => {
   let agent;

   beforeEach(async () => {
       agent = await getAuthenticatedAgent(app);
   });

   test('GET /admin/contact — renders with existing icons', async () => {
       await seedSocialDescriptions(1);
       const res = await agent.get('/admin/contact');
       expect(res.status).toBe(200);
       expect(res.text).toContain('fa-brands');
   });

   test('GET /admin/contact — renders empty when no icons', async () => {
       const res = await agent.get('/admin/contact');
       expect(res.status).toBe(200);
   });

   test('POST /admin/contact — replaces all Social descriptions', async () => {
       await seedSocialDescriptions(1); // old data
       const res = await agent
           .post('/admin/contact')
           .type('form')
           .send('title=fa-brands+fa-twitter&description=https://twitter.com');
       expect(res.status).toBe(302);
       const descs = await DescriptionSchema.find({ category: 'Social' });
       expect(descs).toHaveLength(1);
       expect(descs[0].title).toBe('fa-brands fa-twitter');
   });

   test('POST /admin/contact — strips <i class="..."> wrapper from title', async () => {
       const res = await agent
           .post('/admin/contact')
           .type('form')
           .send('title=%3Ci+class%3D%22fa-brands+fa-instagram%22%3E&description=https://instagram.com');
       expect(res.status).toBe(302);
       const desc = await DescriptionSchema.findOne({ category: 'Social' });
       expect(desc.title).toBe('fa-brands fa-instagram');
   });
});

jest.mock('../google/GoogleDriveService', () => require('./helpers/mockGoogleDrive'));
jest.mock('../utils/googleDriveUtil', () => ({
   uploadImageToDrive: jest.fn().mockResolvedValue(['mock-thumb-id', 'mock-img-id', true]),
   downloadImages: jest.fn().mockResolvedValue(undefined),
   deleteImageWithIds: jest.fn().mockResolvedValue(undefined),
   deleteAllImages: jest.fn().mockResolvedValue(undefined),
   searchAllFiles: jest.fn().mockResolvedValue([]),
}));

require('./setup');
const request = require('supertest');
const app = require('../app');
const { seedCollection, seedCVDescriptions, seedSocialDescriptions } = require('./helpers/seedHelper');

describe('Public Routes', () => {
   test('GET / — renders portfolio with collections', async () => {
       await seedCollection({ name: 'Paintings', order: 0 });
       const res = await request(app).get('/');
       expect(res.status).toBe(200);
       expect(res.text).toContain('Paintings');
   });

   test('GET / — renders empty portfolio', async () => {
       const res = await request(app).get('/');
       expect(res.status).toBe(200);
   });

   test('GET / — hidden collections are not shown', async () => {
       await seedCollection({ name: 'Visible', isHide: false, order: 0 });
       await seedCollection({ name: 'Secret', isHide: true, order: 1 });
       const res = await request(app).get('/');
       expect(res.status).toBe(200);
       expect(res.text).toContain('Visible');
       expect(res.text).not.toContain('Secret');
   });

   test('GET /about — renders CV descriptions', async () => {
       await seedCVDescriptions(2);
       const res = await request(app).get('/about');
       expect(res.status).toBe(200);
       expect(res.text).toContain('CV Title 0');
       expect(res.text).toContain('CV Title 1');
   });

   test('GET /contact — renders social icons', async () => {
       await seedSocialDescriptions(1);
       const res = await request(app).get('/contact');
       expect(res.status).toBe(200);
       expect(res.text).toContain('fa-brands');
   });

   test('GET /collection/:name — renders artworks', async () => {
       await seedCollection({ name: 'Drawings' });
       const res = await request(app).get('/collection/Drawings');
       expect(res.status).toBe(200);
       expect(res.text).toContain('Drawings');
   });

   test('GET /robots.txt — returns allow-all', async () => {
       const res = await request(app).get('/robots.txt');
       expect(res.status).toBe(200);
       expect(res.text).toContain('User-agent: *');
       expect(res.text).toContain('Allow: /');
   });

   test('GET /nonexistent — returns 404', async () => {
       const res = await request(app).get('/does-not-exist');
       expect(res.status).toBe(404);
       expect(res.text).toContain('Page not found');
   });
});

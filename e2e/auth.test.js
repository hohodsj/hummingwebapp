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
const UserSchema = require('../models/userSchema');

describe('Auth Routes', () => {
   test('GET /login — renders login page', async () => {
       const res = await request(app).get('/login');
       expect(res.status).toBe(200);
       expect(res.text).toContain('Login');
   });

   test('GET /auth/google — redirects to Google OAuth', async () => {
       const res = await request(app).get('/auth/google');
       expect(res.status).toBe(302);
       expect(res.headers.location).toContain('accounts.google.com');
   });

   test('GET /admin/portfolio — redirects to /login when not authenticated', async () => {
       const res = await request(app).get('/admin/portfolio');
       expect(res.status).toBe(302);
       expect(res.headers.location).toBe('/login');
   });

   test('POST /login — valid credentials redirect to admin', async () => {
       const user = new UserSchema({ username: 'admin@test.com' });
       await UserSchema.register(user, 'password123');
       const res = await request(app)
           .post('/login')
           .type('form')
           .send({ username: 'admin@test.com', password: 'password123' });
       expect(res.status).toBe(302);
       expect(res.headers.location).toBe('/admin/portfolio');
   });
});

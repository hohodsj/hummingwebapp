const sessionConfig = require('../../config/session');

describe('Session Configuration', () => {
   test('session config has required fields', () => {
       expect(sessionConfig).toHaveProperty('name', 'session');
       expect(sessionConfig).toHaveProperty('secret');
       expect(sessionConfig).toHaveProperty('resave', false);
       expect(sessionConfig).toHaveProperty('saveUninitialized', true);
       expect(sessionConfig.cookie).toHaveProperty('httpOnly', true);
       expect(sessionConfig.cookie).toHaveProperty('maxAge');
   });

   test('session cookie expires in 7 days', () => {
       const sevenDays = 1000 * 60 * 60 * 24 * 7;
       expect(sessionConfig.cookie.maxAge).toBe(sevenDays);
   });

   test('session cookie has secret (from environment or default)', () => {
       // In test environment, SECRET is set in .env.test
       expect(sessionConfig.secret).toBeTruthy();
       expect(typeof sessionConfig.secret).toBe('string');
   });

   test('session cookie expires property matches maxAge', () => {
       expect(sessionConfig.cookie.expires).toBeLessThanOrEqual(
           Date.now() + sessionConfig.cookie.maxAge + 1000 // +1s buffer for timing
       );
   });
});

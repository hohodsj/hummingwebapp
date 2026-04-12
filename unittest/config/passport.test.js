describe('Passport Configuration', () => {
   test('passport config module is loadable', () => {
       const configurePassport = require('../../config/passport');
       expect(typeof configurePassport).toBe('function');
   });

   test('configurePassport function executes without errors', () => {
       const configurePassport = require('../../config/passport');
       // In test environment, GOOGLE_DRIVE_CLIENT_ID and GOOGLE_DRIVE_CLIENT_SECRET are set
       expect(() => {
           configurePassport();
       }).not.toThrow();
   });

   test('configurePassport is callable', () => {
       const configurePassport = require('../../config/passport');
       expect(configurePassport).toBeDefined();
       expect(typeof configurePassport).toBe('function');
   });
});

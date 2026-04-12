const request = require('supertest');
const UserSchema = require('../../models/userSchema');

async function getAuthenticatedAgent(app) {
   // Check if test user already exists
   let user = await UserSchema.findByUsername('testadmin@test.com');
   
   // If not, create it
   if (!user) {
       user = new UserSchema({ username: 'testadmin@test.com' });
       await UserSchema.register(user, 'testpassword123');
   }

   // Create a session-aware agent using supertest's built-in cookie jar
   const agent = request.agent(app);

   // Login via the existing POST /login route (passport-local strategy)
   const loginRes = await agent
       .post('/login')
       .type('form')
       .send({ username: 'testadmin@test.com', password: 'testpassword123' });

   // Verify login was successful (should redirect to /admin/portfolio or render page)
   if (loginRes.status !== 302 && loginRes.status !== 200) {
       throw new Error(`Login failed with status ${loginRes.status}. Response: ${loginRes.text.substring(0, 200)}`);
   }

   // Verify the location header for redirect
   if (loginRes.status === 302 && loginRes.headers.location && loginRes.headers.location === '/login') {
       throw new Error(`Login redirected back to /login, credentials rejected`);
   }

   return agent;
}

module.exports = { getAuthenticatedAgent };

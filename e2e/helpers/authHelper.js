const request = require('supertest');
const UserSchema = require('../../models/userSchema');

async function getAuthenticatedAgent(app) {
   // Register a test user via passport-local-mongoose
   const user = new UserSchema({ username: 'testadmin@test.com' });
   await UserSchema.register(user, 'testpassword123');

   // Create a session-aware agent using supertest's built-in cookie jar
   const agent = request.agent(app);

   // Login via the existing POST /login route (passport-local strategy)
   await agent
       .post('/login')
       .type('form')
       .send({ username: 'testadmin@test.com', password: 'testpassword123' });

   return agent;
}

module.exports = { getAuthenticatedAgent };

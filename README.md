# HummingWeb Application

A full-stack web application for portfolio management with Google Drive integration, admin dashboard, and comprehensive test coverage.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.x or higher
- **npm** 8.x or higher
- **MongoDB** 6.x (local or Docker)
- **Google OAuth** credentials (for Google Drive integration)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd hummingwebapp

# Install dependencies
npm install

# Set up environment variables (see .env Setup section)
cp .env.example .env
# Edit .env with your configuration

# Start the application
npm start
```

The application will start on `http://localhost:3000` (or the port specified in `.env`).

---

## 📋 Environment Setup

### .env File Configuration

Create a `.env` file in the root directory with the following variables:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_URL=mongodb://localhost:27017/hummingweb

# Google OAuth (for Google Drive integration)
GOOGLE_DRIVE_CLIENT_ID=your_client_id_here
GOOGLE_DRIVE_CLIENT_SECRET=your_client_secret_here
GOOGLE_DRIVE_REDIRECT_URL=https://localhost:3000/google/callback
GOOGLE_DRIVE_REFRESH_TOKEN=your_refresh_token_here

# Session Secret (for express-session)
SECRET=your_secret_key_here

# Cloudinary (for image hosting - optional)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_KEY=your_cloudinary_key
CLOUDINARY_SECRET=your_cloudinary_secret
```

### Getting Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable **Google Drive API**
4. Create OAuth 2.0 credentials (Desktop/Web Application)
5. Set authorized redirect URIs to `https://localhost:3000/google/callback`
6. Copy the Client ID and Client Secret to `.env`
7. Get refresh token via [OAuth 2.0 Playground](https://developers.google.com/oauthplayground)

### .env.test File (For Testing)

The test environment uses a separate `.env.test` file with mock credentials:

```bash
NODE_ENV=test
DB_URL=mongodb://localhost:27017/hummingsang-test
GOOGLE_DRIVE_CLIENT_ID=test-client-id
GOOGLE_DRIVE_CLIENT_SECRET=test-client-secret
GOOGLE_DRIVE_REDIRECT_URL=http://localhost:3000/google/callback
GOOGLE_DRIVE_REFRESH_TOKEN=test-refresh-token
SECRET=test-secret
```

---

## 🏃 Running the Project

### Development Server

```bash
# Start the development server
npm start

# Server runs on http://localhost:3000
```

### Production Deployment

```bash
# Build and run for production
NODE_ENV=production npm start
```

---

## 🧪 Testing

### Prerequisites for Testing

#### Option 1: Local MongoDB (Recommended)

**macOS with Homebrew:**
```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Verify connection
mongosh mongodb://localhost:27017/hummingsang-test
```

**Linux:**
```bash
# Install MongoDB
sudo apt-get install mongodb

# Start service
sudo systemctl start mongodb
```

**Windows / Docker:**
```bash
# Run MongoDB in Docker
docker run -d -p 27017:27017 --name mongo mongo:6
```

#### Option 2: Docker Compose (Full Test Stack)

```bash
# Start MongoDB and test runner
docker-compose -f docker-compose.test.yml up

# In another terminal, run tests
docker-compose -f docker-compose.test.yml exec test-runner npm test

# Cleanup
docker-compose -f docker-compose.test.yml down
```

### Running Tests

#### All Tests (Unit + E2E)
```bash
npm test
```

**Output:**
```
Test Suites: 15 passed, 15 total
Tests:       73 passed, 73 total
```

#### E2E Tests Only
```bash
npm run test:e2e
```

#### Unit Tests Only
```bash
npm test -- --testPathPattern=unittest
```

#### Specific Test File
```bash
npm test -- e2e/admin-portfolio.test.js
npm test -- unittest/config/db.test.js
```

#### Watch Mode (for development)
```bash
npm test -- --watch
```

#### With Coverage Report
```bash
npm test -- --coverage
```

### Test Organization

**E2E Tests** (6 test suites, 35 tests):
- `e2e/admin-portfolio.test.js` - Portfolio management
- `e2e/admin-collection.test.js` - Collection CRUD operations
- `e2e/admin-about.test.js` - About page management
- `e2e/admin-contact.test.js` - Contact page management
- `e2e/auth.test.js` - Authentication flows
- `e2e/public.test.js` - Public website routes

**Unit Tests** (9 test suites, 38 tests):
```
unittest/
├── config/
│   ├── db.test.js (3 tests)
│   ├── session.test.js (4 tests)
│   └── passport.test.js (3 tests)
├── controllers/
│   ├── portfolioController.test.js (3 tests)
│   ├── collectionController.test.js (5 tests)
│   ├── aboutController.test.js (5 tests)
│   └── contactController.test.js (6 tests)
├── factory/
│   └── factory.test.js (1 test)
└── utils/
    └── formatArtwork.test.js (8 tests)
```

### Test Configuration

**Timeout:** 30 seconds per test (configurable in `jest.config.js`)  
**Test Database:** `hummingsang-test`  
**Environment:** Automatically loaded from `.env.test`  
**Execution:** Serial (one test at a time for consistency)

### Common Test Issues

**Issue: "connect ECONNREFUSED ::1:27017"**

MongoDB is not running. Start it:
```bash
# macOS
brew services start mongodb-community

# Docker
docker run -d -p 27017:27017 mongo:6
```

**Issue: Tests timeout after 30 seconds**

Check if MongoDB is responsive:
```bash
mongosh mongodb://localhost:27017/hummingsang-test
```

**Issue: Duplicate key errors**

Reset test database:
```bash
mongosh mongodb://localhost:27017/hummingsang-test
> db.dropDatabase()
```

---

## 📁 Project Structure

```
hummingwebapp/
├── config/                    # Configuration modules
│   ├── db.js                 # Database connection
│   ├── session.js            # Express session config
│   └── passport.js           # Authentication strategies
│
├── controllers/              # Request handlers (MVC pattern)
│   ├── portfolioController.js
│   ├── collectionController.js
│   ├── aboutController.js
│   └── contactController.js
│
├── models/                   # Mongoose schemas
│   ├── userSchema.js
│   ├── collectionSchema.js
│   ├── artworkSchema.js
│   └── descriptionSchema.js
│
├── routes/                   # Express route definitions
│   ├── public.js            # Public website routes
│   ├── auth.js              # Authentication routes
│   └── admin.js             # Admin dashboard routes
│
├── utils/                    # Utility functions
│   ├── googleDriveUtil.js   # Google Drive integration
│   ├── formatArtwork.js     # Image formatting
│   ├── deleteUtils.js       # Database cleanup
│   ├── catchAsync.js        # Error handling wrapper
│   └── ...
│
├── factory/                  # Factory functions for creating database objects
│   └── factory.js
│
├── views/                    # EJS templates
│   ├── layouts/
│   ├── partials/
│   ├── admin/
│   └── ...
│
├── public/                   # Static files
│   ├── javascripts/
│   ├── stylesheets/
│   └── images/
│
├── e2e/                      # End-to-end tests
│   ├── admin-portfolio.test.js
│   ├── admin-collection.test.js
│   └── ...
│
├── unittest/                 # Unit tests
│   ├── config/
│   ├── controllers/
│   ├── utils/
│   └── ...
│
├── app.js                    # Express app entry point
├── middleware.js             # Custom middleware
├── package.json
├── jest.config.js           # Jest testing configuration
├── .env                      # Environment variables (local dev)
├── .env.test                 # Environment variables (testing)
└── README.md
```

---

## 🛠 Development

### Project Stack

- **Backend:** Node.js + Express.js
- **Database:** MongoDB + Mongoose
- **Authentication:** Passport.js (Local + Google OAuth)
- **File Storage:** Google Drive Integration
- **Image Processing:** Sharp
- **Templating:** EJS
- **Testing:** Jest + Supertest
- **Session Management:** express-session

### Key Dependencies

```json
{
  "express": "^4.18.1",
  "mongoose": "^6.4.4",
  "passport": "^0.5.0",
  "multer": "^1.4.5",
  "googleapis": "^107.0.0",
  "sharp": "^0.30.7",
  "ejs": "^3.1.8",
  "jest": "^29.6.4",
  "supertest": "^6.3.3"
}
```

### Code Architecture

The application follows **MVC (Model-View-Controller)** pattern:

- **Models** (`models/`) - Database schemas
- **Views** (`views/`) - EJS templates
- **Controllers** (`controllers/`) - Business logic
- **Routes** (`routes/`) - HTTP endpoint definitions
- **Utilities** (`utils/`) - Reusable functions

### Error Handling

All async handlers use the `catchAsync` wrapper:

```javascript
// controllers/portfolioController.js
module.exports.index = catchAsync(async (req, res) => {
  // Errors automatically forwarded to Express error handler
});
```

### Database Cleanup

Automatic cleanup utilities in `utils/deleteUtils.js`:
- `removeCollection()` - Delete collection and all related images
- Removes images from Google Drive
- Updates collection order/visibility

---

## 🔐 Authentication

### Local Authentication

- Username/password login
- Passport LocalStrategy
- Session-based persistence

### Google OAuth 2.0

- Google Drive integration for file storage
- Automatic user creation on first login
- Refresh token for offline access

### Session Management

- 7-day session expiration
- HttpOnly cookies (secure mode in production)
- Flash messages for user feedback

---

## 📦 Deployment

### Environment Checklist

Before deploying to production:

- [ ] Set `NODE_ENV=production`
- [ ] Use secure, random `SECRET`
- [ ] Set `DB_URL` to production MongoDB
- [ ] Generate new Google OAuth credentials for production domain
- [ ] Set appropriate `REDIRECT_URL` for production
- [ ] Enable HTTPS/SSL
- [ ] Set secure cookie settings (secure, httpOnly, sameSite)

### Docker Deployment

```bash
# Build Docker image
docker build -t hummingweb:latest .

# Run container
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e DB_URL=mongodb://... \
  -e SECRET=... \
  hummingweb:latest
```

---

## 📊 Testing Statistics

**Overall Test Coverage:**
- ✅ 15 Test Suites
- ✅ 73 Tests (100% passing)
- ✅ 35 E2E Tests
- ✅ 38 Unit Tests

**Test Execution:**
- Average runtime: 3-5 seconds
- Timeout per test: 30 seconds
- Database: mongodb-memory-server (local) / MongoDB (CI/CD)

---

## 🤝 Contributing

### Development Workflow

1. Create a feature branch
2. Write tests for new functionality
3. Implement the feature
4. Ensure all tests pass (`npm test`)
5. Submit pull request

### Code Style

- Use async/await (not callbacks/promises)
- Use const/let (not var)
- Use arrow functions for callbacks
- Wrap async handlers with `catchAsync`
- Add JSDoc comments for complex functions

### Adding New Tests

Tests follow naming conventions:
- `*.test.js` for test files
- Organized in `e2e/` or `unittest/` directories
- Mock external dependencies in unit tests
- Test both success and failure cases

---

## 📝 Troubleshooting

### Port Already in Use

```bash
# Find and kill process using port 3000
lsof -i :3000
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

### MongoDB Connection Issues

```bash
# Check if MongoDB is running
brew services list

# View MongoDB logs
tail -f /usr/local/var/log/mongodb/mongo.log

# Restart MongoDB
brew services restart mongodb-community
```

### Module Not Found Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

### Test Failures

```bash
# Run tests with verbose output
npm test -- --verbose

# Run single test file
npm test -- e2e/admin-portfolio.test.js

# Run tests in watch mode
npm test -- --watch
```

---

## 📞 Support

For issues or questions:
1. Check the [TESTING.md](./TESTING.md) guide for test-specific help
2. Review [project_overview.md](./project_overview.md) for architecture details
3. Check logs for error messages
4. Verify all environment variables are correctly set

---

## 📄 License

ISC

---

## System Requirements

| Component | Version | Purpose |
|-----------|---------|---------|
| Node.js | 18.x+ | JavaScript runtime |
| npm | 8.x+ | Package manager |
| MongoDB | 6.x+ | Database |
| Git | 2.x+ | Version control |
| macOS/Linux/Windows | Current | Operating system |

---

## Changelog

### v1.0.0 - Initial Release

- ✅ Portfolio management system
- ✅ Admin dashboard with collections
- ✅ Google Drive integration
- ✅ Public website
- ✅ User authentication (Local + Google OAuth)
- ✅ 73 comprehensive tests with 100% pass rate
- ✅ MVC architecture
- ✅ Docker support

For recent refactoring changes, see git commit history.

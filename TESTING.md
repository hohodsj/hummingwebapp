# Testing Guide

## Prerequisites

### Option 1: Local MongoDB (Recommended for Development)

**Mac with Homebrew:**
```bash
# Install MongoDB (if not already installed)
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Verify connection
mongosh mongodb://localhost:27017/hummingsang-test
```

**Docker (Alternative):**
```bash
# Start MongoDB in Docker
docker run -d -p 27017:27017 --name mongo mongo:6

# To stop later
docker stop mongo
```

### Option 2: Docker Compose (For Full Test Environment)

```bash
# Run full test stack with MongoDB
docker-compose -f docker-compose.test.yml up

# In another terminal, run tests inside container
docker-compose -f docker-compose.test.yml exec test-runner npm test

# Cleanup
docker-compose -f docker-compose.test.yml down
```

## Running Tests

### All Tests
```bash
npm test
```

### E2E Tests Only
```bash
npm run test:e2e
```

### Watch Mode (for development)
```bash
npm test -- --watch
```

### Specific Test File
```bash
npm test -- e2e/admin-portfolio.test.js
```

## Test Configuration

- **Test Timeout**: 30 seconds per test (configured in jest.config.js)
- **Test Database**: `hummingsang-test` (separate from development)
- **Environment**: Automatically loaded from `.env.test`

### Test Environment Variables (.env.test)
- NODE_ENV=test
- DB_URL=mongodb://localhost:27017/hummingsang-test
- GOOGLE_DRIVE_CLIENT_ID=test-client-id (mock credential)
- GOOGLE_DRIVE_CLIENT_SECRET=test-client-secret (mock credential)
- SECRET=test-secret

## Common Issues

### "connect ECONNREFUSED ::1:27017"
MongoDB is not running. Start it with:
```bash
brew services start mongodb-community
# or
docker run -d -p 27017:27017 mongo:6
```

### Tests Timeout After 30 seconds
Database operations may be slow. Check MongoDB is running and responsive:
```bash
mongosh mongodb://localhost:27017/hummingsang-test
```

### Duplicate Key Errors
Database not properly cleaned between tests. Ensure MongoDB is running and `.afterEach()` hooks execute:
```bash
# Reset test database
mongosh mongodb://localhost:27017/hummingsang-test
> db.dropDatabase()
```

## Test Database Cleanup

The test suite automatically:
- Cleans up all collections after each test (afterEach hook)
- Drops the database after all tests (afterAll hook)
- Creates a fresh test database for each test run

## GitHub Actions CI

Tests run automatically on push. The CI uses:
- Docker Compose with MongoDB service (`docker-compose.test.yml`)
- Custom environment variables provided in GitHub Actions secrets
- Node test runner executing all test suites

See workflow file in `.github/workflows/` for full CI configuration.

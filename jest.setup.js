require('dotenv').config({ path: '.env.test' });

// Set mongoose strictQuery to suppress deprecation warning
const mongoose = require('mongoose');
mongoose.set('strictQuery', false);

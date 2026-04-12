const secret = process.env.SECRET || 'ThisSecretOnlyWorksInDevEnv';

const sessionConfig = {
   name: 'session',
   secret,
   resave: false,
   saveUninitialized: true,
   cookie: {
       httpOnly: true,
       expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
       maxAge: 1000 * 60 * 60 * 24 * 7,
   },
};

module.exports = sessionConfig;

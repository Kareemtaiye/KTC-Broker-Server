const dotenv = require('dotenv');

dotenv.config({ path: 'config.env' });
const mongoose = require('mongoose');
const app = require('./app');

const { DATABASE, DATABASE_PASSWORD, PORT } = process.env;

const db = DATABASE.replace('<password>', DATABASE_PASSWORD);

mongoose.connect(db).then(() => {
  console.log('Database connection succesful');
});

const port = PORT || 8000;
const server = app.listen(port, () => {
  console.log(`Listening to server on port ${port}`);
});

process.on('unhandledRejection', err => {
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

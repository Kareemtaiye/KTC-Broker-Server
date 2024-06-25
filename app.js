const express = require('express');

const app = express();
const morgan = require('morgan');
const cookie = require('cookie-parser');

const userRouter = require('./routes/userRoutes');
const GlobalErrorHandler = require('./controllers/errorController');
const AppError = require('./utilities/AppError');

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(cookie());
app.use(express.json());

//middleware to handle various routes, treated as base url on each route files
app.use('/api/v1/users', userRouter);

app.use('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on the server`, 404));
});

app.use(GlobalErrorHandler);

module.exports = app;

const express = require('express');
const helmet = require('helmet');
const sanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const app = express();
const morgan = require('morgan');
const cookie = require('cookie-parser');
const compression = require('compression');

const userRouter = require('./routes/userRoutes');
const GlobalErrorHandler = require('./controllers/errorController');
const AppError = require('./utilities/AppError');

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(helmet());

//PREVENT NOSQL QUERY INJECTION
app.use(sanitize());

//PRREVENT XSS ATTACKS
app.use(xss());
//PASRES THE COOKIE OBJECT
app.use(cookie());
//SERVERS STATIC FIES
app.use(express.json());

app.use(compression());
//middleware to handle various routes, treated as base url on each route files
app.use('/api/v1/users', userRouter);

app.use('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on the server`, 404));
});

app.use(GlobalErrorHandler);

module.exports = app;

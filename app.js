process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message, err.stack);
// console.log('ERROR STACK', err.stack)
  process.exit(1);
});

const axios = require('axios');
axios.get('http://img-upload.onrender.com/test/status').then(result => console.log(result.data))

const keepAlive = ()=> {

  setTimeout(()=> {
    console.log("inside set timeout");
    axios.get('http://img-upload.onrender.com/test/status').then(result => console.log(result.data))
    keepAlive();
  }, 14 * 60 * 1000)

}

keepAlive();


console.log('UPLOAD IMAGE FROM BUFFER');

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const cors = require('cors');

const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const userRouter = require('./routes/userRoutes');
const testRouter = require('./routes/test');
const globalErrorHandler = require('./controllers/errorController');
require('dotenv').config();

const app = express();

const DB = process.env.DB;

// SET SECURITY HEADERS USING HELMET
app.use(helmet());

// PREVENT HTTP PARAMETER POLLUTION
app.use(hpp());

// LIMIT REQUESTS BEYOND A CERTAIN THRESHOLD

const limiter = rateLimit({
  max: 200,
  windowMs: 1 * 60 * 60 * 1000,
  message: 'Too many requests. Please try again later',
});

app.use('/api', limiter);

// CONNECT TO MONGODB USING MONGOOSE
mongoose.connect(DB, { useNewUrlParser: true }).then((con) => {
  console.log('Database connected to successfully');
});

// USE DEFAULT EXPRESS BODY PARSER
app.use(express.json());

// SANITIZE DATA TO PREVENT NOSQL INJECTION ATTACKS
app.use(mongoSanitize());

// USE LOGGER
app.use(morgan('dev'));

// ALLOW CROSS ORIGIN RESOURCE SHARING
app.use('*', cors());

app.use('/user', userRouter);
app.use('/test', testRouter);

// USE GLOBAL ERROR HANDLER
app.use(globalErrorHandler);

const PORT = process.env.PORT;
const server = app.listen(PORT, () => {
  console.log(`app is listening on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message, err);
  server.close(() => {
    process.exit(1);
  });
});

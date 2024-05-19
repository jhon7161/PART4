require('dotenv').config();
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const cors = require('cors');
const mongoose = require('mongoose');
const config = require('./utils/config');
const logger = require('./utils/loggers');
const middleware = require('./utils/middleware')
const blogsRouter = require('./controllers/bloggss')


const app = express();
const distPath = path.join(__dirname, 'FRONT/dist');

mongoose.set('strictQuery', false)

logger.info('connecting to', config.MONGODB_URI)

mongoose.connect(config.MONGODB_URI)
  .then(() => {
    logger.info('connected to MongoDB')
  })
  .catch((error) => {
    logger.error('error connecting to MongoDB:', error.message)
  })


app.use(express.static(distPath));
app.use(cors());
app.use(express.json());
app.use(middleware.requestLogger)
app.use('/api/blogs', blogsRouter);
app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)


module.exports = app;

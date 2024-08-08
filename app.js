const config = require('./utils/config');
const express = require('express');
require('express-async-errors');
require('dotenv').config();
const path = require('path');
const morgan = require('morgan');
const cors = require('cors');
const mongoose = require('mongoose');
const logger = require('./utils/loggers');
const middleware = require('./utils/middleware');
const blogsRouter = require('./controllers/bloggss');
const usersRouter = require('./controllers/users');
const loginRouter = require('./controllers/login');
const testingRouter = require ('./controllers/testing')
const bodyParser = require('body-parser');

const app = express();
const distPath = path.join(__dirname, 'FRONT/dist');

mongoose.set('strictQuery', false);

logger.info('connecting to', config.MONGODB_URI);

mongoose.connect(config.MONGODB_URI)
  .then(() => {
    logger.info('connected to MongoDB');
  })
  .catch((error) => {
    logger.error('error connecting to MongoDB:', error.message);
  });

// Middlewares de uso general
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(morgan('tiny'));
app.use(middleware.requestLogger);
app.use(middleware.tokenExtractor);

// Rutas sin autenticación
app.use('/api/login', loginRouter);
app.use('/api/users', usersRouter);

// Servir archivos estáticos del frontend
app.use(express.static(distPath));

// Rutas de blogs
app.use('/api/blogs', blogsRouter);
if (process.env.NODE_ENV === 'test') {
  const testingRouter = require('./controllers/testing');
  app.use('/api/testing', testingRouter);
}

// Middleware para manejar endpoints desconocidos
app.use(middleware.unknownEndpoint);

// Middleware de manejo de errores
app.use(middleware.errorHandler);

module.exports = app;

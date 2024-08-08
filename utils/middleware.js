const logger = require('./loggers');
const jwt = require('jsonwebtoken');
const User = require('../models/users'); // Importar el modelo User

// Middleware para registrar la información de la solicitud
const requestLogger = (request, response, next) => {
  logger.info('Method:', request.method);
  logger.info('Path:  ', request.path);
  logger.info('Body:  ', request.body);
  logger.info('---');
  next();
};

// Middleware para extraer el token de autorización
const tokenExtractor = (request, response, next) => {
  const authorization = request.get('authorization');

  if (authorization && authorization.startsWith('Bearer ')) {
    const token = authorization.replace('Bearer ', '');
    request.token = token;
  }

  next();
};

// Middleware para extraer el usuario basado en el token
const userExtractor = async (req, res, next) => {
  const token = req.token

  if (token) {
    try {
      const decodedToken = jwt.verify(token, process.env.SECRET)
      if (!decodedToken.id) {
        return res.status(401).json({ error: 'token missing or invalid' })
      }

      const user = await User.findById(decodedToken.id)
      req.user = user
    } catch (error) {
      return res.status(401).json({ error: 'token invalid' })
    }
  } else {
    return res.status(401).json({ error: 'token missing' })
  }

  next()
}

// Middleware para manejar rutas desconocidas
const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'Unknown endpoint' });
};

// Middleware para manejar errores
const errorHandler = (error, request, response, next) => {
  logger.error(error.message);

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'Malformatted id' });
  } else if (error.name === 'ValidationError') {
    return response.status(400).send({ error: error.message });
  } else if (error.code === 11000 && error.keyPattern && error.keyPattern.username) {
    return response.status(400).send({ error: 'Username must be unique' });
  } else if (error.name === 'JsonWebTokenError') {
    return response.status(401).send({ error: 'Token invalid' });
  } else if (error.message === 'User not found' || error.message === 'Token invalid or missing') {
    return response.status(401).send({ error: error.message });
  }

  next(error);
};

module.exports = {
  requestLogger,
  tokenExtractor,
  userExtractor,
  unknownEndpoint,
  errorHandler
};

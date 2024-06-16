const bcrypt = require('bcrypt');
const usersRouter = require('express').Router();
const User = require('../models/users');

// POST /api/users - Crear un nuevo usuario
usersRouter.post('/', async (request, response, next) => {
  const { username, name, password } = request.body;

  // Verificación de longitud de contraseña
  if (!password || password.length < 3) {
    return response.status(400).json({ error: 'Password must have at least 3 characters' });
  }

  try {
    // Verificación de unicidad del username
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return response.status(400).json({ error: 'Username must be unique' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = new User({
      username,
      name,
      passwordHash,
    });

    const savedUser = await user.save();
    response.status(201).json(savedUser);
  } catch (error) {
    next(error); // Pasar cualquier error al middleware de manejo de errores
  }
});

// GET /api/users - Obtener todos los usuarios
usersRouter.get('/', async (request, response, next) => {
  try {
    const users = await User.find({}).populate('blogs', { title: 1, author: 1, url: 1, likes: 1 });
    response.json(users);
  } catch (error) {
    next(error); // Pasar cualquier error al middleware de manejo de errores
  }
});

// DELETE /api/users/:id - Eliminar un usuario por ID
usersRouter.delete('/:id', async (request, response, next) => {
  try {
    const userId = request.params.id;
    await User.findByIdAndDelete(userId);
    response.status(204).end();
  } catch (error) {
    next(error); // Pasar cualquier error al middleware de manejo de errores
  }
});

module.exports = usersRouter;

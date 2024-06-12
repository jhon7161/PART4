const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/users')


usersRouter.post('/', async (request, response) => {
  const { username, name, password } = request.body

  // Verificación de longitud de contraseña
  if (!password || password.length < 3) {
    return response.status(400).json({ error: 'Password must have at least 3 characters' });
  }

  try {
    // Validación del esquema de Mongoose
    await User.validate({ username, name, passwordHash: password });

    // Verificación de unicidad del username
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return response.status(400).json({ error: 'Username must be unique' });
    }

    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    const user = new User({
      username,
      name,
      passwordHash,
    })

    const savedUser = await user.save()

    response.status(201).json(savedUser)
  } catch (error) {
    // Manejo de errores de validación del esquema
    if (error.name === 'ValidationError') {
      return response.status(400).json({ error: error.message });
    } else {
      response.status(500).json({ error: 'Something went wrong' });
    }
  }
})

usersRouter.get('/', async (request, response) => {
  const users = await User
  .find({}).populate('blogs', { title: 1, author: 1, url: 1,likes: 1 })
  response.json(users)
})




usersRouter.delete('/:id', async (request, response) => {
  const userId = request.params.id

  try {
    await User.findByIdAndDelete(userId)
    response.status(204).end()
  } catch (error) {
    response.status(400).json({ error: 'No se pudo eliminar el usuario' })
  }
})

module.exports = usersRouter

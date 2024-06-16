const blogsRouter = require('express').Router();
const Blog = require('../models/blog');
const middleware = require('../utils/middleware');
const { tokenExtractor, userExtractor } = middleware;

// Middleware para extraer el token de la solicitud
blogsRouter.use(tokenExtractor);

// Endpoint para obtener todos los blogs con información del usuario que los creó
blogsRouter.get('/', async (req, res, next) => {
  try {
    const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 });
    res.json(blogs);
  } catch (error) {
    next(error);
  }
});

// Endpoint para obtener un blog específico por ID
blogsRouter.get('/:id', async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id).populate('user', { username: 1, name: 1 });
    if (blog) {
      res.json(blog);
    } else {
      res.status(404).end();
    }
  } catch (error) {
    next(error);
  }
});

// Endpoint para crear un nuevo blog
blogsRouter.post('/', userExtractor, async (req, res, next) => {
  try {
    const body = req.body;
    const user = req.user;

    const blog = new Blog({
      title: body.title,
      author: body.author,
      url: body.url,
      likes: body.likes || 0,
      user: user._id
    });

    const savedBlog = await blog.save();
    user.blogs = user.blogs.concat(savedBlog._id);
    await user.save();
    res.status(201).json(savedBlog);
  } catch (error) {
    next(error);
  }
});

// Endpoint para actualizar un blog por ID
blogsRouter.put('/:id', userExtractor, async (req, res, next) => {
  try {
    const body = req.body;
    const user = req.user;

    const blog = {
      title: body.title,
      author: body.author,
      url: body.url,
      likes: body.likes
    };

    const updatedBlog = await Blog.findById(req.params.id);
    if (!updatedBlog) {
      return res.status(404).json({ error: 'blog not found' });
    }

    // Verificar si el usuario es el autor del blog
    if (updatedBlog.user.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'unauthorized action' });
    }

    // Actualizar el blog
    const result = await Blog.findByIdAndUpdate(req.params.id, blog, { new: true });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Endpoint para eliminar un blog por ID
blogsRouter.delete('/:id', userExtractor, async (req, res, next) => {
  try {
    const user = req.user;

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'blog not found' });
    }

    // Verificar si el usuario es el autor del blog
    if (blog.user.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'unauthorized action' });
    }

    // Eliminar el blog
    await Blog.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = blogsRouter;

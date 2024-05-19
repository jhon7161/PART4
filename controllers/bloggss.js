const blogsRouter = require('express').Router();
const Blog = require('../models/blog');

// Obtener todos los blogs
blogsRouter.get('/', (req, res) => {
  Blog.find({})
    .then(blogs => {
      res.json(blogs);
    })
    .catch(error => res.status(500).json({ error: 'Failed to fetch blogs' }));
});

// Crear un nuevo blog
blogsRouter.post('/', (req, res) => {
  const blog = new Blog(req.body);

  blog.save()
    .then(result => {
      res.status(201).json(result);
    })
    .catch(error => res.status(400).json({ error: 'Failed to create blog' }));
});

module.exports = blogsRouter;

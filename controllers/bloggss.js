const blogsRouter = require('express').Router();
const Blog = require('../models/blog');
const middleware = require('../utils/middleware');

// Ruta GET pública
blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 });
  response.json(blogs);
});

// Rutas que requieren autenticación
blogsRouter.post('/', middleware.userExtractor, async (request, response) => {
  const user = request.user;

  const blog = new Blog({
    ...request.body,
    user: user._id
  });

  const savedBlog = await blog.save();
  user.blogs = user.blogs.concat(savedBlog._id);
  await user.save();

  response.status(201).json(savedBlog);
});

blogsRouter.delete('/:id', middleware.userExtractor, async (request, response) => {
  try {
    const user = request.user;
    const blog = await Blog.findById(request.params.id);

    if (!blog) {
      return response.status(404).json({ error: 'Blog not found' });
    }

    if (blog.user.toString() !== user.id.toString()) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    await blog.deleteOne(); // or await Blog.findByIdAndDelete(request.params.id);

    response.status(204).end();
  } catch (error) {
    console.error('Error deleting blog:', error);
    response.status(500).json({ error: 'Internal Server Error' });
  }
});

blogsRouter.put('/:id/likes', middleware.userExtractor, async (request, response) => {
  const blogId = request.params.id;
  const user = request.user;

  try {
    const blogToUpdate = await Blog.findById(blogId);

    if (!blogToUpdate) {
      return response.status(404).json({ error: 'Blog not found' });
    }

    if (blogToUpdate.likedBy.includes(user._id)) {
      // Dislike
      blogToUpdate.likes -= 1;
      blogToUpdate.likedBy = blogToUpdate.likedBy.filter(userId => userId.toString() !== user._id.toString());
    } else {
      // Like
      blogToUpdate.likes += 1;
      blogToUpdate.likedBy.push(user._id);
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      blogId,
      blogToUpdate,
      { new: true }
    ).populate('user', { username: 1, name: 1 });

    response.json(updatedBlog);
  } catch (error) {
    console.error('Error updating blog:', error);
    response.status(500).json({ error: 'Internal Server Error' });
  }
});
blogsRouter.put('/:id', middleware.userExtractor, async (request, response) => {
  const { title, author, url, likes } = request.body;
  const blogId = request.params.id;
  const user = request.user;

  try {
    const blogToUpdate = await Blog.findById(blogId);

    if (!blogToUpdate) {
      return response.status(404).json({ error: 'Blog not found' });
    }

    if (blogToUpdate.user.toString() !== user.id.toString()) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      blogId,
      { title, author, url, likes },
      { new: true }
    ).populate('user', { username: 1, name: 1 });

    response.json(updatedBlog);
  } catch (error) {
    console.error('Error updating blog:', error);
    response.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = blogsRouter;

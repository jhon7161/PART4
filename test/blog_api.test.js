const { describe, beforeEach, afterEach, it } = require('mocha');
const assert = require('assert');
const supertest = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const app = require('../app'); // Suponiendo que app.js exporta directamente el servidor de Express
const Blog = require('../models/blog'); // Suponiendo que blog.js exporta directamente el modelo de Blog
const User = require('../models/users'); // Suponiendo que users.js exporta directamente el modelo de User
const helper = require('./test_helper'); // Suponiendo que test_helper.js exporta funciones de ayuda para las pruebas

const api = supertest(app);

const initialBlogs = [
  {
    title: 'HTML is easy',
    author: 'John Doe',
    url: 'http://example.com/html-is-easy',
    likes: 0,
  },
  {
    title: 'Browser can execute only JavaScript',
    author: 'Jane Smith',
    url: 'http://example.com/browser-javascript',
    likes: 10,
  },
];

beforeEach(async function() {
  this.timeout(5000); // Aumentar el timeout a 5 segundos (ajustar según sea necesario)
  await Blog.deleteMany({});
  await User.deleteMany({});

  const passwordHash = await bcrypt.hash('sekret', 10);
  const user = new User({ username: 'root', passwordHash });
  await user.save();

  const blogObjects = initialBlogs.map(blog => new Blog({ ...blog, user: user._id }));
  const promiseArray = blogObjects.map(blog => blog.save());
  await Promise.all(promiseArray);

  const loginResponse = await api
    .post('/api/login')
    .send({ username: 'root', password: 'sekret' });

  token = loginResponse.body.token;
});

describe('GET /api/blogs', () => {
  it('returns blogs as JSON', async () => {
    const response = await api
      .get('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    assert.strictEqual(response.body.length, initialBlogs.length);
  });
});
describe('PUT /api/blogs/:id', () => {
  it('updates a blog', async () => {
    const blogsAtStart = await helper.blogsInDb();
    const blogToUpdate = blogsAtStart[0];

    const updatedBlog = {
      ...blogToUpdate,
      likes: blogToUpdate.likes + 1,
    };

    const response = await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedBlog)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    assert.strictEqual(response.body.likes, updatedBlog.likes);
  });
});

describe('DELETE /api/blogs/:id', () => {
  it('deletes a blog', async () => {
    const blogsAtStart = await helper.blogsInDb();
    const blogToDelete = blogsAtStart[0];

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    const blogsAtEnd = await helper.blogsInDb();
    assert.strictEqual(blogsAtEnd.length, initialBlogs.length - 1);

    const titles = blogsAtEnd.map(blog => blog.title);
    assert(!titles.includes(blogToDelete.title));
  });
});
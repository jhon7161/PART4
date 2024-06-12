const { test, after, beforeEach, describe } = require('node:test');
const assert = require('node:assert');
const supertest = require('supertest');
const request = require('supertest');
const mongoose = require('mongoose');
const helper = require('./test_helper');
const app = require('../app');
const api = supertest(app);
const Blog = require('../models/blog');
const bcrypt = require('bcrypt')
const User = require('../models/users')
describe('when there is initially some blogs saved', () => {
  beforeEach(async () => {
    await Blog.deleteMany({});

    const blogObjects = helper.initialBlogs.map(blog => new Blog(blog));
    const promiseArray = blogObjects.map(blog => blog.save());
    await Promise.all(promiseArray);
  });

  test('blogs are returned as json', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/);
  });

  test('all blogs are returned', async () => {
    const response = await api.get('/api/blogs');

    assert.strictEqual(response.body.length, helper.initialBlogs.length);
  });

  test('a specific blog is within the returned blogs', async () => {
    const response = await api.get('/api/blogs');

    const contents = response.body.map(r => r.title);
    assert(contents.includes('poema'));
  });

  test('a valid blog can be added', async () => {
    const newBlog = {
      title: "karol morales",
      author: "jhonsito",
      url: "http://www.suarez.com",
      likes: 110,
    };

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const blogsAtEnd = await helper.blogsInDb();
    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1);

    const contents = blogsAtEnd.map(n => n.title);
    assert(contents.includes(newBlog.title));
  });

  test('there are two blogs', async () => {
    const response = await api.get('/api/blogs');
    assert.strictEqual(response.body.length, helper.initialBlogs.length);
  });

  test('the first blog is about "poema"', async () => {
    const response = await api.get('/api/blogs');
    const titles = response.body.map(e => e.title);
    assert(titles.includes('poema'));
  });

  test('blog without content is not added', async () => {
    const newBlog = {
      author: "jhonsito",
      likes: 110,
    };

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(400);

    const response = await api.get('/api/blogs');
    assert.strictEqual(response.body.length, helper.initialBlogs.length);
  });

  test('a specific blog can be viewed', async () => {
    const blogsAtStart = await helper.blogsInDb();

    const blogToView = blogsAtStart[0];

    const resultBlog = await api
      .get(`/api/blogs/${blogToView.id}`)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    assert.deepStrictEqual(resultBlog.body, blogToView);
  });

  test('a blog can be deleted', async () => {
    const blogsAtStart = await helper.blogsInDb();
    const blogToDelete = blogsAtStart[0];

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .expect(204);

    const blogsAtEnd = await helper.blogsInDb();

    const titles = blogsAtEnd.map(r => r.title);
    assert(!titles.includes(blogToDelete.title));

    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length - 1);
  });

  test('Si la propiedad likes falta en la solicitud, su valor debe ser 0 por defecto', async () => {
    const newBlog = {
      title: 'Mi nuevo blog',
      author: 'Autor Anónimo',
      url: 'http://example.com'
    };

    const response = await request(app)
      .post('/api/blogs')
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    assert.strictEqual(response.body.likes, 0);
  });
});
test('likes are updated for a specific blog', async () => {
  // Realiza una solicitud para obtener todos los blogs
  const initialResponse = await api.get('/api/blogs');
  const initialBlogs = initialResponse.body;

  // Elige un blog de los obtenidos inicialmente
  const blogToUpdate = initialBlogs[0];

  // Realiza una solicitud PUT para actualizar los likes del blog seleccionado
  const updatedResponse = await api
    .put(`/api/blogs/${blogToUpdate.id}/like`)
    .expect(200); // Espera una respuesta con código de estado 200

  // Verifica que la cantidad de likes haya aumentado correctamente
  assert.strictEqual(updatedResponse.body.likes, blogToUpdate.likes + 1);
});

describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash })

    await user.save()
  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    assert(usernames.includes(newUser.username))
  })
})
test('creation fails with proper statuscode and message if username already taken', async () => {
  const usersAtStart = await helper.usersInDb()

  const newUser = {
    username: 'root',
    name: 'Superuser',
    password: 'salainen',
  }

  const result = await api
    .post('/api/users')
    .send(newUser)
    .expect(400)
    .expect('Content-Type', /application\/json/)

  const usersAtEnd = await helper.usersInDb()
  assert(result.body.error.includes('expected `username` to be unique'))

  assert.strictEqual(usersAtEnd.length, usersAtStart.length)
})
after(async () => {
  await mongoose.connection.close();
});

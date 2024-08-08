const { describe, beforeEach, afterEach, after, it } = require('mocha');
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

const initialUsers = [
  {
    username: 'root',
    password: 'sekret',
  },
  {
    username: 'testuser',
    password: 'password123',
  },
];

let token;

beforeEach(async function() {
  this.timeout(5000); // Aumentar el timeout a 5 segundos (ajustar según sea necesario)
  await Blog.deleteMany({});
  await User.deleteMany({});

  // Crear usuarios iniciales, excepto el usuario 'testuser' que se usará en la prueba de duplicados
  const passwordHash = await bcrypt.hash('sekret', 10);
  const user = new User({ username: 'root', passwordHash });
  await user.save();

  const loginResponse = await api
    .post('/api/login')
    .send({ username: 'root', password: 'sekret' });

  token = loginResponse.body.token;

  const blogObjects = initialBlogs.map(blog => new Blog({ ...blog, user: user._id }));
  const promiseArray = blogObjects.map(blog => blog.save());
  await Promise.all(promiseArray);
});

afterEach(async () => {
  await Blog.deleteMany({});
  await User.deleteMany({});
});

after(async () => {
  await mongoose.connection.close();
});

// Pruebas de Usuarios
describe('POST /api/users', () => {
  beforeEach(async () => {
    await User.deleteMany({}); // Limpiar la base de datos antes de cada prueba
  });

  it('creates a new user', async () => {
    const newUser = {
      username: 'testuser',
      name: 'Test User',
      password: 'password123',
    };

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    // Verificar que el usuario se haya almacenado correctamente en la base de datos
    const savedUser = await User.findOne({ username: newUser.username });
    assert.strictEqual(response.body.username, savedUser.username);
    assert.strictEqual(response.body.name, savedUser.name);
  });

  it('returns 400 if password is less than 3 characters', async () => {
    const newUser = {
      username: 'testuser',
      name: 'Test User',
      password: 'pw', // Contraseña demasiado corta
    };

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    assert.strictEqual(response.body.error, 'Password must have at least 3 characters');
  });

  it('returns 400 if username already exists', async () => {
    // Crear un usuario con el mismo nombre de usuario antes de la prueba
    const existingUser = new User({
      username: 'testuser',
      name: 'Existing User',
      passwordHash: await bcrypt.hash('password123', 10),
    });
    await existingUser.save();

    const newUser = {
      username: 'testuser', // Mismo nombre de usuario que el usuario existente
      name: 'Duplicate User',
      password: 'anotherpassword',
    };

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    assert.strictEqual(response.body.error, 'Username must be unique');
  });
});
describe('DELETE /api/users/:id', () => {
  let userId;

  beforeEach(async () => {
    // Crear un usuario para luego eliminarlo
    const user = await User.create({
      username: 'userToDelete',
      name: 'User To Delete',
      passwordHash: await bcrypt.hash('deletepass', 10),
    });
    userId = user._id;
  });

  it('should delete a user by ID', async () => {
    await api
      .delete(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    // Verificar que el usuario ya no exista en la base de datos
    const deletedUser = await User.findById(userId);
    assert.strictEqual(deletedUser, null);
  });
});

describe('GET /api/users', () => {
  it('returns users as JSON', async () => {
    const response = await api
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const users = await helper.usersInDb();
    assert.strictEqual(response.body.length, users.length);
  });
});

// Pruebas de Blogs
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

describe('POST /api/blogs', () => {
  it('creates a new blog', async () => {
    const newBlog = {
      title: 'New Blog',
      author: 'New Author',
      url: 'http://example.com/new-blog',
      likes: 5,
    };

    const response = await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    assert.strictEqual(response.body.title, newBlog.title);
    assert.strictEqual(response.body.author, newBlog.author);
    assert.strictEqual(response.body.url, newBlog.url);
    assert.strictEqual(response.body.likes, newBlog.likes);

    const blogsAtEnd = await helper.blogsInDb();
    assert.strictEqual(blogsAtEnd.length, initialBlogs.length + 1);

    const titles = blogsAtEnd.map(blog => blog.title);
    assert(titles.includes(newBlog.title));
  });
});

describe('PUT /api/blogs/:id', () => {
  it('updates a blog', async () => {
    // Obtener los blogs iniciales
    const blogsAtStart = await helper.blogsInDb();
    const blogToUpdate = blogsAtStart[0];

    // Datos actualizados (incrementar likes)
    const updatedBlog = {
      title: blogToUpdate.title,
      author: blogToUpdate.author,
      url: blogToUpdate.url,
      likes: blogToUpdate.likes + 1, // Incrementar los likes
    };

    // Enviar solicitud PUT para actualizar el blog
    const response = await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedBlog)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    // Verificar que los likes se hayan actualizado correctamente en la respuesta
    assert.strictEqual(response.body.likes, updatedBlog.likes);

    // Verificar que los cambios se reflejan en la base de datos
    const blogsAtEnd = await helper.blogsInDb();
    const updatedBlogFromDb = blogsAtEnd.find(blog => blog.id === blogToUpdate.id);
    assert.strictEqual(updatedBlogFromDb.likes, updatedBlog.likes);
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
afterEach(async () => {
  await Blog.deleteMany({});
  await User.deleteMany({});
});

after(async () => {
  await mongoose.connection.close();
});

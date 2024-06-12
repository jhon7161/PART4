const Blog = require('../models/blog');
const User = require('../models/users');

// Datos de prueba para blogs
const initialBlogs = [
  {
    title: "poema",
    author: "jhon",
    url: "http://miurl.com",
    likes: 100,
  },
  {
    title: "Nuevo Blog",
    author: "Autor del Blog",
    url: "http://www.ejemplo.com",
    likes: 10,
  },
];

// Función para obtener el ID de un blog que no existe en la base de datos
const nonExistingBlogId = async () => {
  const blog = new Blog({
    title: "IDDIFERENTE",
    author: "EDISNON",
    url: "http://TUurl.com",
    likes: 12,
  });
  await blog.save();
  await blog.deleteOne();

  return blog._id.toString();
};

// Función para obtener todos los blogs en la base de datos
const blogsInDb = async () => {
  const blogs = await Blog.find({});
  return blogs.map(blog => blog.toJSON());
};

// Datos de prueba para usuarios
const initialUsers = [
  {
    username: "user1",
    password: "password1",
    // Otros campos del usuario
  },
  {
    username: "user2",
    password: "password2",
    // Otros campos del usuario
  }
];

// Función para obtener todos los usuarios en la base de datos
const usersInDb = async () => {
  const users = await User.find({});
  return users.map(user => user.toJSON());
};

module.exports = {
  initialBlogs,
  nonExistingBlogId,
  blogsInDb,
  initialUsers,
  usersInDb
};

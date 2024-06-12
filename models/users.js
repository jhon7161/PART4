const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    minlength: 3, // Se añade la restricción de longitud mínima
    unique: true // Esto asegura la unicidad de username
  },
  name: String, // Campo para el nombre del usuario
  passwordHash: {
    type: String,
    required: true,
    minlength: 3 // Se añade la restricción de longitud mínima
  },
  blogs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Blog' }] // Vinculación con blogs
});

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
    delete returnedObject.passwordHash; // El passwordHash no debe mostrarse
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;

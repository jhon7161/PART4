require('dotenv').config()

const PORT = process.env.PORT
const MONGODB_URI = process.env.DB_URLL

module.exports = {
  MONGODB_URI,
  PORT
}
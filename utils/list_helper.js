const _ = require('lodash');

const dummy = (blogs) => {
  return 1
}
const totalLikes = (blogs) => {
  return blogs.reduce((sum, blog) => sum + blog.likes, 0)
}

const favoriteBlog = (blogs) => {
  if (blogs.length === 0) {
    return null
  }

  let favorite = blogs[0]

  for (let blog of blogs) {
    if (blog.likes > favorite.likes) {
      favorite = blog
    }
  }

  return {
    title: favorite.title,
    author: favorite.author,
    likes: favorite.likes
  }
}

const mostBlogs = (blogs) => {
  if (blogs.length === 0) {
    return null;
  }

  const authorBlogsCount = _.countBy(blogs, 'author');
  const authorWithMostBlogs = _.maxBy(Object.keys(authorBlogsCount), author => authorBlogsCount[author]);

  return {
    author: authorWithMostBlogs,
    blogs: authorBlogsCount[authorWithMostBlogs]
  };
};

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs
}

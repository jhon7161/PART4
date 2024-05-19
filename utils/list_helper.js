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

const mostLikes = (blogs) => {
  if (blogs.length === 0) {
    return null;
  }

  const authorLikes = _.reduce(blogs, (result, blog) => {
    result[blog.author] = (result[blog.author] || 0) + blog.likes;
    return result;
  }, {});

  const authorWithMostLikes = _.maxBy(_.keys(authorLikes), author => authorLikes[author]);

  return {
    author: authorWithMostLikes,
    likes: authorLikes[authorWithMostLikes]
  };
};

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}

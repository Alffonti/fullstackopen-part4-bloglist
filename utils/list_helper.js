const dummy = blogs => {
  return 1
}

const totalLikes = blogs => {
  return blogs.reduce((sum, currentBlog) => sum + currentBlog.likes, 0)
}

const favoriteBlog = blogs => {
  return blogs.reduce((favorite, currentBlog) => {
    if (favorite === null || currentBlog.likes > favorite.likes) {
      return {
        title: currentBlog.title,
        author: currentBlog.author,
        likes: currentBlog.likes,
      }
    }
    return favorite
  }, null)
}

const mostBlogs = blogs => {
  return Object.values(
    blogs.reduce((allAuthors, { author }) => {
      allAuthors[author] =
        author in allAuthors
          ? { author, blogs: allAuthors[author].blogs + 1 }
          : { author, blogs: 1 }
      return allAuthors
    }, {})
  ).reduce((mostBlogsAuthor, currentAuthor) => {
    if (
      mostBlogsAuthor === null ||
      currentAuthor.blogs > mostBlogsAuthor.blogs
    ) {
      return currentAuthor
    }
    return mostBlogsAuthor
  }, null)
}

const mostLikes = blogs =>
  Object.values(
    blogs.reduce((allAuthors, { author, likes }) => {
      allAuthors[author] =
        author in allAuthors
          ? { author, likes: allAuthors[author].likes + likes }
          : { author, likes: likes }
      return allAuthors
    }, {})
  ).reduce((mostLikedAuthor, currentAuthor) => {
    if (
      mostLikedAuthor === null ||
      currentAuthor.likes > mostLikedAuthor.likes
    ) {
      return currentAuthor
    }
    return mostLikedAuthor
  }, null)

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes,
}

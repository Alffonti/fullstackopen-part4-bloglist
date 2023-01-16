// const jwt = require('jsonwebtoken')
const blogRouter = require('express').Router()
const middleware = require('../utils/middleware')
const Blog = require('../models/blog')

blogRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
  response.json(blogs)
})

blogRouter.get('/:id', async (request, response) => {
  const blog = await Blog.findById(request.params.id)

  if (blog) {
    response.json(blog)
  } else {
    request.statusMessage = `A blog with an id of ${request.params.id} doesn't exists`
    response.status(400).end()
  }
})

blogRouter.post('/', middleware.userExtractor, async (request, response) => {
  const { url, title, author, likes } = request.body

  const user = request.user

  if (!(title || url)) {
    return response.status(400).json({ error: 'title or url missing' })
  }

  const blog = new Blog({
    url: url,
    title: title,
    author: author,
    user: user.id,
    likes: likes || 0,
  })

  const savedBlog = await blog.save()
  user.blogs = user.blogs.concat(savedBlog._id)
  await user.save()

  response.status(201).json(savedBlog)
})

blogRouter.delete(
  '/:id',
  middleware.userExtractor,
  async (request, response) => {
    const user = request.user
    const blog = await Blog.findById(request.params.id)

    if (!blog) {
      return response.status(404).end()
    }

    if (user.id.toString() !== blog.user.toString()) {
      return response.status(401).json({
        error: 'this blog can be deleted only by the user who created it.',
      })
    }

    await Blog.findByIdAndDelete(request.params.id)
    response.status(204).end()
  }
)

blogRouter.put('/:id', async (request, response) => {
  const { title, author, url, likes } = request.body

  const updatedBlog = await Blog.findByIdAndUpdate(
    request.params.id,
    { title, author, url, likes },
    { new: true }
  )

  response.json(updatedBlog)
})

module.exports = blogRouter

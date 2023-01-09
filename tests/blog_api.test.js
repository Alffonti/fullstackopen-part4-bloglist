const request = require('supertest')
const app = require('../app')
const helper = require('./test_helper')
const Blog = require('../models/blog')
const mongoose = require('mongoose')

beforeEach(async () => {
  await Blog.deleteMany({})

  const blogObjects = helper.initialBlogs.map(blog => new Blog(blog))
  const promiseArray = blogObjects.map(blog => blog.save())

  await Promise.all(promiseArray)
})

test('the correct amount of blog posts are returned in the JSON format', async () => {
  const response = await request(app)
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /json/)

  expect(response.body).toHaveLength(helper.initialBlogs.length)
})

test('blog posts contain an id property', async () => {
  const response = await request(app).get('/api/blogs')

  response.body.forEach(note => {
    expect(note.id).toBeDefined()
  })
})

test('a valid blog post can be added', async () => {
  const newBlog = {
    title: 'Type wars',
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html',
    likes: 2,
  }

  const response = await request(app)
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /json/)

  const blogsAtEnd = await helper.blogsInDb()

  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)
  expect(blogsAtEnd).toContainEqual(response.body)
})

test('the likes property of a new blog is set to 0 if it missing in the body request', async () => {
  const newBlog = {
    title: 'Type wars',
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html',
  }

  const response = await request(app)
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /json/)

  expect(response.body.likes).toBe(0)
})

test('new blog without title or url is not added', async () => {
  const newBlog = {
    author: 'Robert C. Martin',
  }

  await request(app).post('/api/blogs').send(newBlog).expect(400)

  const blogsAtEnd = await helper.blogsInDb()
  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
})

afterAll(() => {
  mongoose.connection.close()
})

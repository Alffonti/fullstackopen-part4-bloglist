const request = require('supertest')
const app = require('../app')
const helper = require('./test_helper')
const Blog = require('../models/blog')
const mongoose = require('mongoose')

beforeEach(async () => {
  await Blog.deleteMany({})
  await Blog.insertMany(helper.initialBlogs)
})

describe('when there is initiallly some blog posts saved', () => {
  test('the correct amount of blog posts are returned in the JSON format', async () => {
    const response = await request(app)
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /json/)

    expect(response.body).toHaveLength(helper.initialBlogs.length)
  })

  test('blog posts contain an id property', async () => {
    const response = await request(app).get('/api/blogs')

    response.body.forEach(blog => {
      expect(blog.id).toBeDefined()
    })
  })
})

describe('viewing a specific blog post', () => {
  test('succeeds with a valid id', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToView = blogsAtStart[0]

    const resultBlog = await request(app)
      .get(`/api/blogs/${blogToView.id}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(resultBlog.body).toEqual(blogToView)
  })

  test('fails with status code 400 if note does not exits', async () => {
    const invalidId = '5a3d5da59070081a82a3445'

    await request(app).get(`/api/blogs/${invalidId}`).expect(400)
  })
})

describe('addition of a new blog post', () => {
  test('succeeds with valid data', async () => {
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

  test('the likes property is set to 0 if it is missing in the request body', async () => {
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

  test('fails with satus code 400 if data is invalid (title or url missing)', async () => {
    const newBlog = {
      author: 'Robert C. Martin',
    }

    await request(app).post('/api/blogs').send(newBlog).expect(400)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
  })
})

describe('deletion of a blog post', () => {
  test('succeeds with a satus code 204 if id is valid', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    await request(app).delete(`/api/blogs/${blogToDelete.id}`).expect(204)

    const blogsAtEnd = await helper.blogsInDb()

    expect(blogsAtEnd).not.toContainEqual(blogToDelete)
  })

  test('fails with a satus code 204 if id is valid', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    await request(app).delete(`/api/blogs/${blogToDelete.id}`).expect(204)

    const blogsAtEnd = await helper.blogsInDb()

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length - 1)
    expect(blogsAtEnd).not.toContainEqual(blogToDelete)
  })
})

describe('updating a blog post', () => {
  test('succeeds with valid data', async () => {
    const blogsAtStart = await helper.blogsInDb()

    const blogToUpdate = {
      ...blogsAtStart[0],
      likes: blogsAtStart[0].likes + 1,
    }

    await request(app)
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(blogToUpdate)
      .expect(200)

    const blogsAtEnd = await helper.blogsInDb()

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
    expect(blogsAtEnd).toContainEqual(blogToUpdate)
    expect(blogsAtEnd).not.toContainEqual(blogsAtStart[0])
  })
})

afterAll(() => {
  mongoose.connection.close()
})

const request = require('supertest')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const helper = require('./test_helper')
const app = require('../app')

const Blog = require('../models/blog')
const User = require('../models/user')

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

  test('fails with status code 400 if note does not exist', async () => {
    const invalidId = '5a3d5da59070081a82a3445'

    await request(app).get(`/api/blogs/${invalidId}`).expect(400)
  })
})

describe('addition of a new blog post', () => {
  let token = null
  beforeAll(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)

    const user = new User({
      username: 'root',
      name: 'Superuser',
      passwordHash,
    })

    const savedUser = await user.save()

    token = jwt.sign(
      { username: savedUser.username, id: savedUser._id },
      process.env.SECRET,
      { expiresIn: 60 * 60 }
    )

    return token
  })

  test('succeeds with valid data', async () => {
    const newBlog = {
      title: 'Things I dont know as of 2018',
      author: 'Dan Abramov',
      url: 'https://overreacted.io/things-i-dont-know-as-of-2018',
      likes: 18,
    }

    await request(app)
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /json/)

    const blogsAtEnd = await helper.blogsInDb()

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

    const titles = blogsAtEnd.map(blog => blog.title)
    expect(titles).toContain('Things I dont know as of 2018')
  })

  test('the likes property is set to 0 if it is missing in the request body', async () => {
    const newBlog = {
      title: 'Things I dont know as of 2018',
      author: 'Dan Abramov',
      url: 'https://overreacted.io/things-i-dont-know-as-of-2018',
    }

    await request(app)
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /json/)

    const blogsAtEnd = await helper.blogsInDb()

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)
    expect(blogsAtEnd[blogsAtEnd.length - 1].likes).toBe(0)
  })

  test('fails with status code 400 if data is invalid (title and url missing)', async () => {
    const newBlog = {
      author: 'Robert C. Martin',
    }

    await request(app)
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(400)

    const blogsAtEnd = await helper.blogsInDb()

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
  })

  test('fails with status 401 if token is invalid', async () => {
    token = 'invalidtoken'

    const newBlog = {
      title: 'Things I dont know as of 2018',
      author: 'Dan Abramov',
      url: 'https://overreacted.io/things-i-dont-know-as-of-2018',
      likes: 18,
    }

    const response = await request(app)
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(401)
      .expect('Content-Type', /json/)

    expect(response.body.error).toContain('token missing or invalid')

    const blogsAtEnd = await helper.blogsInDb()

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)

    const titles = blogsAtEnd.map(blog => blog.title)
    expect(titles).not.toContain('Things I dont know as of 2018')
  })
})

describe('deletion of a blog post', () => {
  let token = null
  beforeAll(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)

    const user = new User({
      username: 'root',
      name: 'Superuser',
      passwordHash,
    })

    const savedUser = await user.save()

    token = jwt.sign(
      { username: savedUser.username, id: savedUser._id },
      process.env.SECRET,
      { expiresIn: 60 * 60 }
    )

    return token
  })

  beforeEach(async () => {
    await Blog.deleteMany({})

    const newBlog = {
      title: 'Things I dont know as of 2018',
      author: 'Dan Abramov',
      url: 'https://overreacted.io/things-i-dont-know-as-of-2018',
      likes: 18,
    }

    await request(app)
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)
  })

  test('succeeds with a status code 204 if id is valid', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    await request(app)
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204)

    const blogsAtEnd = await helper.blogsInDb()

    expect(blogsAtEnd).toHaveLength(blogsAtStart.length - 1)

    const titles = blogsAtEnd.map(blog => blog.title)
    expect(titles).not.toContain(blogToDelete.title)
  })

  test('fails with status 401 if token is invalid', async () => {
    token = 'invalidtoken'

    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    const response = await request(app)
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(401)

    expect(response.body.error).toContain('token missing or invalid')

    const blogsAtEnd = await helper.blogsInDb()

    expect(blogsAtEnd).toHaveLength(blogsAtStart.length)

    const titles = blogsAtEnd.map(blog => blog.title)
    expect(titles).toContain('Things I dont know as of 2018')
  })
})

describe('updating a blog post', () => {
  test('succeeds with valid data', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToUpdate = blogsAtStart[0]

    await request(app)
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send({ likes: 8 })
      .expect(200)

    const blogsAtEnd = await helper.blogsInDb()

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
    expect(blogsAtEnd[0].likes).toBe(8)
  })
})

afterAll(() => {
  mongoose.connection.close()
})

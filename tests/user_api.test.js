const request = require('supertest')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const helper = require('./test_helper')
const app = require('../app')

const User = require('../models/user')

describe('when there is initially one user at DB', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({
      username: 'root',
      name: 'Superuser',
      passwordHash,
    })

    await user.save()
  })

  test('creation succeeds with a new username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'alffonti',
      name: 'Alonso Fonti',
      password: 'jf984rhdr7',
    }

    await request(app)
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const usernames = usersAtEnd.map(user => user.username)
    expect(usernames).toContain(newUser.username)
  })

  test('creation fails with proper status code and message if username is already taken', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'Admin',
      password: 'jf984rhdr7',
    }

    const result = await request(app)
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(result.body.error).toBe('username must be unique')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toEqual(usersAtStart)
  })

  test('creation fails with proper status code and message if username and password are not given', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'alffonti',
      name: 'Alf Fonti',
    }

    const result = await request(app)
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(result.body.error).toBe('username and password are required')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toEqual(usersAtStart)
  })

  test('creation fails with proper status code and message if username is less than 3 characters long', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'al',
      name: 'Alf Fonti',
      password: 'jf984rhdr7',
    }

    const result = await request(app)
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(result.body.error).toBe(
      'username must be at least 3 characters long'
    )

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toEqual(usersAtStart)
  })

  test('creation fails with proper status code and message if password is less than 3 characters long', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'alffonti',
      name: 'Alf Fonti',
      password: 'jf',
    }

    const result = await request(app)
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(result.body.error).toBe(
      'password must be at least 3 characters long'
    )

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toEqual(usersAtStart)
  })
})

afterAll(() => {
  mongoose.connection.close()
})

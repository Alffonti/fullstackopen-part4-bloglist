const bcrypt = require('bcrypt')
const userRouter = require('express').Router()
const User = require('../models/user')

userRouter.get('/', async (request, response) => {
  const users = await User.find({}).populate('blogs', {
    url: 1,
    title: 1,
    author: 1,
  })
  response.json(users)
})

userRouter.get('/:id', async (request, response) => {
  const user = await User.findById(request.params.id)

  if (user) {
    response.json(user)
  } else {
    response.status(404).end()
  }
})

userRouter.post('/', async (request, response) => {
  const { username, name, password } = request.body

  if (!(username && password)) {
    return response
      .status(400)
      .json({ error: 'username and password are required' })
  }

  if (username.length < 3) {
    return response
      .status(400)
      .json({ error: 'username must be at least 3 characters long' })
  }

  if (password.length < 3) {
    return response
      .status(400)
      .json({ error: 'password must be at least 3 characters long' })
  }

  const existingUser = await User.findOne({ username })

  if (existingUser) {
    return response.status(400).json({ error: 'username must be unique' })
  }

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, saltRounds)

  const user = new User({
    username,
    name,
    passwordHash,
  })

  const savedUser = await user.save()
  response.status(201).json(savedUser)
})

module.exports = userRouter

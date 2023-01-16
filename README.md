# Blog list

Application's link: https://bloglist.cyclic.app/

## Overview

This repository aims to build a Blog List application,that allows users to save information about interesting blogs they have stumbled across on the internet. For each listed blog contains the author, title, URL, and amount of upvotes from users of the application.

The list of blogs can be read from the address https://bloglist.cyclic.app/api/blogs

The **nodemon** tool was installed in order to automatically restart the node application when file changes in the repository are detected.

The following npm-script was added:
 ```
 "dev": "nodemon index.js"
 ```
 to run the application with nodemon.

 The Visual Studio Code **REST client** plugin was installed to send HTTP requests and view the response in Visual Studio Code directly.

 The HTTP requests are located in `.http` files within the `requests` directory and must follow the standard RFC 2616 that including request method, headers, and body. The HTTP requests can be sent by using the shortcut Ctrl+Alt+R(Cmd+Alt+R for macOS), by right-clicking in the editor and then selecting Send Request in the menu, or by pressing F1 and then typing Rest Client: Send Request, the response will be previewed in a separate webview panel of Visual Studio Code.

 The application was refactored to use the `async/await` syntax instead of `then` methods when handling promises. The **express-async-errors** library was installed to automatically **catch exceptions** when they occurs and pass them to the error-handling middleware. So, there is no need to write `try-catch` statements keeping the code uncluttered.

## Directory structure

 This repository separates the different responsabilites into separate modules and is structured as follows:

```
├── index.js
├── app.js
├── build
│   └── ...
├── controllers
│   └── blog.js
├── models
│   └── blog.js
├── package-lock.json
├── package.json
├── utils
│   ├── config.js
│   ├── logger.js
│   └── middleware.js
```

The `controllers` directory defines the route handling functions.
The `models` directory defines the Mongoose schema for blog entries.
The `utils` directory defines the environment variables, middlewares, and the logging functions.
The `index.js` file imports the actual application from the `app.js` file and then starts the application.
The `app.js` file establishes the connection to the database and loads the middlewares to the application.

## Database

The **MongoDB Atlas** cloud data platform was used to built the MongoDB database.

The **Mongoose** library was installed to provide schema validation, and to map objects in the code into documents in MongoDB.

Errors are handled by the **error-handler middleware**. E.g.: if the id query parameter is invalid, the error handler will send a response to the browser with the response object passed as a parameter.
```
{ error: 'malformatted id' }
```

## Schema

A blog entry has the following schema:

```javascript
const blogSchema = new mongoose.Schema({
  title: String,
  author: String,
  url: String,
  likes: Number,
})
```

The `toJSON` option was set in the Blog schema to format the JSON object that will be returned when sending a response (the document in MongoDB is transformed).

The schema of the blog defined in the `models/blog.js` file was updated so that it contains information about the user who created it:

```javascript
const noteSchema = new mongoose.Schema({
 //
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
})
```

The `populate()` method was used in order to show the contents (`date` and `content` fields) of the users' notes when an HTTP GET request is made to the `/api/users` route.

A user has the following schema:

```javascript
const userSchema = new mongoose.Schema({
  username: { type: String, minLength: 3, required: true },
  name: String,
  passwordHash: { type: String, required: true },
  blogs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Blog',
    },
  ],
})
```

Each user has an array of references to all of the notes created by him/her.

## Linting

The **ESlint** package was installed as a development dependency.

The ESlint default configuration was run with the command:

```
npx eslint --init
```

After answering the questions, the `.eslintrc.js` configuration file was created.

The following npm script `"lint": "eslint ."`  was added to check every file in the project by ESlint.

The `build` directory was ignored by ESlint by creating a `.eslintignore` file in the project's root.

The VSCode ESlint plugin was installed in order to run the linter continuously and see errors (which are underlined with a red line) in the code immediately.

## Helper functions

Helper funtions are located in the `utils/list_helper.js` file.

The `reduce()` array method was used in conjuction with the `values()` object method in order to find the author who has the largest amount of blogs and likes.

## Unit testing

The Jest library was installed as a development dependency to test the backend application.

The npm script `"test": "jest --verbose"` was added to execute tests with Jest and to report about the test execution with the verbose style.

The execution environment and test timeout configuration options were defined in the `jest.config.js` file:
```
module.exports = {
  testEnvironment: 'node',
  testTimeout: 100000,
}
```

Jest is specified in the environment property in the `.eslintrc.js` file in order to be supported by ESlint and to avoid errors when using Jest variables.

Tests are located in `.test.js` files within the `tests` directory.

Related tests where grouped within describe blocks to improve the readability of the test output.

The -t option can be used for running tests with a specific name (useful while fixing a failing test):
```
npm test -- -t "<test name>"
```

## Integration testing

The supertest package was installed as a development dependency in order to test HTTP requests to the `/api/blogs` URL.

The API is was tested by making HTTP requests and inspecting the database with Mongoose.

Tests related to testing the API are located in the `tests/blog_api.test.js` file.

A test database (defined in the `.env` file ) was used during testing.

The `test` script was updated to:
```
"test": "NODE_ENV=test jest --verbose --runInBand --forceExit --detectOpenHandles"
```
in order to set the mode of execution to *test* while the `test` script is executed. The --runInBand and --forceExit options were added to execute the test serially and force Jest exit when all tests have completed running. Mongoose is not fully compatible with Jest, that's why the --forceExit is needed (in case Mongoose resources are still being held on).

NB: The logger functions were updated so that messages are not displayed to the console in test mode in order to keep the test execution output clean.

The initial test database state and other functions (fetching blogs stored in the database, etc) were added to the `test_helper.js` file.

The database is clear out and initialize with an initial database state before each test is run in order to ensure the database is in the same state during testing.

The connection to the database is closed after all the tests are finished executing.

## User administration and token authentication

The following restrictions were added in order to create a new user:
- both username and password are required.
- both username and password must be at least 3 characters long.
- username must be unique

The **bcrypt** package was installed to generate **password hashes**. When a user is created, his/her password hash is stored in the database instead of the user' password.

The `hash` method is used to generate the password hash.

```javascript
usersRouter.post('/', async (request, response) => {
  //
  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, saltRounds)
}
```

When the user log into the application, through the `/api/login` router, the backend application compares the password to the password hash stored in the user's document.


```javascript
loginRouter.post('/', async (request, response) => {
  //
  const passwordCorrect =
    user === null ? false : await bcrypt.compare(password, user.passwordHash)
}
```

The **jsonwebtoken** package was installed in order to implement **JSON Web Tokens**.

If the password and the password hash matches, a token is generated by using the `sign` method based on the payload (which contains the user' ID and username) and secret key (which is stored in the `.env` file.). The token is sent to the client it the user login to the application succesfully.

```javascript
loginRouter.post('/', async (request, response) => {
  //
  const payload = { username: user.username, id: user._id }
  const token = jwt.sign(payload, process.env.SECRET)
}
```

In order to create a note, a token must be sent in in the **Authorization header** when making the HTTP POST request to the `/api/blogs` router.

The token validation helper functions (`tokenExtractor`, `userExtractor`) were separated into its own middleware. The `token` and `user` variables were set in the `request.token` and `request.user` fields, respectively.

The `userExtractor` middleware was registered for the additon and deletion operations of the `/api/blogs` router. The `user` variable can be accessed with `request.user`.

The token is extracted from the HTTP POST request header. The HTTP authentication scheme used in the application is **Bearer**.

```javascript
const tokenExtractor = (request, response, next) => {
  const authorization = request.get('authorization')

  if (authorization && authorization.toLowerCase().startsWith('bearer')) {
    request.token = authorization.substring(7)
  }

  next()
}
```

The `verify` method is used in order to validate the token and decode the payload which contains the user ID which identifies the creator of the blog.

```
const userExtractor = async (request, response, next) => {
  const decodedPayload = jwt.verify(request.token, process.env.SECRET)

  request.user = await User.findById(decodedPayload.id)

  next()
}
```

A note can only be deleted by the user who created it.

```javascript
blogRouter.delete('/:id', middleware.userExtractor, async (request, response) => {
  //
  if (user.id.toString() !== blog.user.toString()) {
    return response.status(401).json({
      error: 'this blog can be deleted only by the user who created it.',
    })
  }
}
```

## Deployment

The application was deployed to **Cyclic**.

## Enviroment variables

The execution mode of the application was defined in the `start`, `dev, and `test` npm-scripts in order to use different environment variables depending on the value of the execution mode of the application (production, development or test). E.g.: the TEST_MONGO_URI variable is used instead of the MONGO_URI in test mode.

The environment variables were defined in the `.env` file at the root of the project, after installing the **dotenv** library, in order to reference them in **development mode**.

The environment variables were defined direclty in the Cyclic dashboard in order to reference those variables in **production mode**.

All environment variables are taken into use in the `utils/config.js` file by adding the `require('dotenv').config()` statement and using the `process.env` syntax.

## Resources

- [Router - Express](https://expressjs.com/en/api.html#router)
- [toJSON schema option - Mongoose](https://mongoosejs.com/docs/guide.html#toJSON)
- [populate - Mongoose](https://mongoosejs.com/docs/populate.html)
- [Project Fields to Return from Query - MongoDB](https://www.mongodb.com/docs/manual/tutorial/project-fields-from-query-results/#return-the-specified-fields-and-the-id-field-only)
- [Specifying-environments - ESlint](https://eslint.org/docs/latest/user-guide/configuring/language-options#specifying-environments)
- [Jest CLI Options](https://jestjs.io/docs/cli#--verbose)
- [test.only - Jest](https://jestjs.io/docs/api#testonlyname-fn-timeout)
- [.toEqual - Jest](https://jestjs.io/docs/expect#toequalvalue)
- [in operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/in)
- [Object.values()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/values)
- [bcrypt repository](https://github.com/kelektiv/node.bcrypt.js)
- [Json Web Tokens](https://jwt.io/)
- [jsonwebtoken repository](https://github.com/auth0/node-jsonwebtoken)
- [HTTP authentication](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication)
- [Set Authorization header to post request](https://github.com/ladjs/supertest/issues/398)

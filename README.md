## Usage

1. docker-compose up for database
2. cd server && npm i && npm start
3. cd frontend/react && npm i && npm start
4. Enjoy!

user data: email: admin@admin.com / password: test

braintree sandbox: fstojanac-braintree / password: zuUJSrFXGTU86fJ

## Schema

Whenever you start a server, it will automatically execute `updateSchema.js` script in order to compile the schema definitions, defined in `schema.js`, to `schema.json` and `schema.graphqls`. This is required by Relay framework. However, you could also run the script manually:

```bash
$ npm run update
```

## Project Structure

    ├── server                          - All of the server side code resides in this folder
    │   ├── config                      - Configuration
    │   │   └── environment             - Separate configuration for each environment
    │   │       ├── development.js      - Development configuration
    │   │       ├── index.js            - Common configuration used in any environment
    │   │       ├── production.js       - Production configuration
    │   │       └── test.js             - Test configuration
    │   ├── data                        - Data and APIs
    │   │   ├── models                  - Model classes that encapsulate query logic
    │   │   ├── mutations               - GraphQL mutations
    │   │   ├── types                   - GraphQL types
    │   │   ├── database.js             - Shared instance of query builder
    │   │   ├── schema.graphqls         - Compiled schema in a readable form
    │   │   ├── schema.js               - Schema definitions
    │   │   └── schema.json             - Compiled schema to be used by Relay
    │   ├── utils                       - Utilities
    │   │   ├── babelRelayPlugin.js     - Babel-relay-plugin provided by Relay
    │   │   ├── logger.js               - Logging utility
    │   │   └── updateSchema.js         - Code for compiling the defined schema to schema.json and schema.graphqls
    │   └── index.js                    - Server entry point
    └── package.json                    - List of dependencies

## Technologies

### Frameworks

[GraphQL](https://github.com/facebook/graphql) - GraphQL is a query language and execution engine tied to any backend service.

[Express](http://expressjs.com/) - Express is a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications.

### Module bundler & Syntax transformers
[Webpack](https://webpack.github.io) - Webpack is a module bundler that takes modules with dependencies and generates static assets representing those modules.

[Babel](https://babeljs.io) - Babel is a JavaScript compiler which allows you to  use next generation, ES6/ES7, JavaScript, today.

### Languages
[ES6/ES7](https://github.com/lukehoban/es6features) - ECMAScript 6, also known as ECMAScript 2015, is the latest version of the ECMAScript standard. ES6 is a significant update to the language.

### Additional Tools
[Eslint](http://eslint.org) - The pluggable linting utility for JavaScript and JSX.

[Nodemon](http://nodemon.io) - Monitor for any changes in your node.js application and automatically restart the server.

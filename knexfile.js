module.exports = {

  development: {
    client: 'mysql',
    connection: {
      host: 'localhost',
      port: 3307,
      user: 'root',
      password: 'root',
      database: 'api-test',
      dateStrings: true,
      multipleStatements: true,
    }
  },

  staging: {
    client: 'mysql',
    connection: {
      host: 'localhost',
      port: 3307,
      user: 'root',
      password: 'root',
      database: 'api-test',
      dateStrings: true,
      multipleStatements: true,
    }
  },

  production: {
    client: 'mysql',
    connection: {
      host: 'localhost',
      port: 3307,
      user: 'root',
      password: 'root',
      database: 'api-test',
      dateStrings: true,
      multipleStatements: true,
    }
  }
};

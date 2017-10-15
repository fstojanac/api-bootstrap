/* eslint-disable global-require, import/no-dynamic-require */
import _ from 'lodash';
import dotenv from 'dotenv-safe';
// Load env variables from .env see .env.exappmpl
dotenv.load();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 8085,
  web: 'localhost',
  adminWeb: 'http://localhost:8081',
  systemUser: {
    email: 'root',
    password: 'LU#98KBpRqUXJ8aMCUX+k3s8^N5qte!Cq2na9Tqjdj-N8zuW*UXEL*ATNN8K8SLN',
  },
  mail: {
    host: 'localhost',
    name: 'test.com',
    ignoreTLS: true,
    port: 1025
  },
  jwt: {
    secret: '@Vm9%xH*v#xrVfJJZmu&y7DSh5*2xhvM45AhKzHc3ZUWH4jVxw35re%qhgZ9XDXq',
    expires: 60 * 30, // 30 minutes
  },
  cookie: {
    secret: 'f@#u5&eTa2&EKHpCxtm^Mv4pr5^XTNSBdS6CYUJ@rD8!7BSj8heWk5#pBge94^2@',
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  },
};
// Environment specific overrides
_.merge(config, require(`./${config.env}`).default);
// Append knex file config
config.knex = require('../../../knexfile')[config.env];

export default config;


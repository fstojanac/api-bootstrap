/* eslint-disable  no-console */
import knex from 'knex';
import chalk from 'chalk';
import config from '../config/environment';

const database = knex(config.knex);

if (process.env.NODE_ENV === 'development') {
  database.on('start', (builder) => {
    const hrstart = process.hrtime();
    builder.on('end', () => {
      const hrend = process.hrtime(hrstart);
      console.log(chalk.yellow(`Query (Execution time (hr): ${hrend[0]}s ${hrend[1] / 1000000}ms)`));
      console.log(builder.toString());
    });
  });
}

export default database;

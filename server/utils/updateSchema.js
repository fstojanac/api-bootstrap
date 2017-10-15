/* eslint-disable no-console */
import path from 'path';
import fs from 'fs';
import { graphql } from 'graphql';
import chalk from 'chalk';
import {
  introspectionQuery,
  printSchema
} from 'graphql/utilities';
import schema from '../data/schema';
import database from '../data/database';

const jsonFile = path.join(__dirname, '../data/schema.json');
const graphQLFile = path.join(__dirname, '../data/schema.graphqls');

async function updateSchema() {
  try {
    const json = await graphql(schema, introspectionQuery);
    fs.writeFileSync(jsonFile, JSON.stringify(json, null, 2));
    fs.writeFileSync(graphQLFile, printSchema(schema));
    console.log(chalk.green('Schema has been regenerated'));

    // knex keep conection alive which makes this process hanging
    // we are explicitly destroying conection pool after schema is
    // generated so program can end, if it's called from the command line
    if (!module.parent) {
      database.destroy();
    }
  } catch (err) {
    console.error(chalk.red(err.stack));
  }
}

// Run the function directly, if it's called from the command line
if (!module.parent) updateSchema();

export default updateSchema;

/* eslint-disable func-names, dot-notation, no-param-reassign, no-undef  */
import database from '../database';
import { BaseModel } from './BaseModel';
import { addressType } from '../types';
import {
  Person,
  State,
} from './';

class Address extends BaseModel {

  sqlJoinRegistry() {
    return {
      creator: (databaseInstance, args, context, parsedAST, tableAlias, parentTableAlias) => {
        this.setQueryDate(databaseInstance, args, context, Person, tableAlias, parentTableAlias);
        databaseInstance.leftJoin(`person as ${tableAlias}`, `${parentTableAlias}.creator_id`, `${tableAlias}.id`);

        return Person.generateSqlJoins(databaseInstance, args, context, parsedAST, tableAlias);
      },
      state: (databaseInstance, args, context, parsedAST, tableAlias, parentTableAlias) => {
        databaseInstance.leftJoin(`state as ${tableAlias}`, `${parentTableAlias}.state_id`, `${tableAlias}.id`);

        return State.generateSqlJoins(databaseInstance, args, context, parsedAST, tableAlias);
      },
      personAddressConnection: () => {
      },
      personConnection: () => {
      },
    };
  }

  getAll(args, context, ast) {
    const databaseInstance = this.tableInstance;
    const parsedAST = this.parseAST(ast);
    const filterKeys = this.requestedFilterKeys(args.filter, this.graphQLTypeFields);

    if (filterKeys.has('date')) {
      context.date = filterKeys.get('date')['__eq'];
      databaseInstance.where('address.created', '<=', filterKeys.get('date')['__eq']);
      databaseInstance.where('address.expired', '>', filterKeys.get('date')['__eq']);
    } else {
      context.date = database.raw('CURRENT_TIMESTAMP(6)');
      databaseInstance.where('address.created', '<=', database.raw('CURRENT_TIMESTAMP(6)'));
      databaseInstance.where('address.expired', '>', database.raw('CURRENT_TIMESTAMP(6)'));
    }

    const sqlAST = this.generateSqlJoins(databaseInstance, args, context, parsedAST);

    return {
      sqlAST,
      countQuery: databaseInstance.clone(),
      availableFilters: this.getAvailableFilters(parsedAST, sqlAST, context),
      availableSorts: this.getAvailableSorts(parsedAST, sqlAST, context),
      dataQuery: (limit, offset) => {
        const connectionQuery = this.generateSqlSelect(databaseInstance, parsedAST, sqlAST, args, context);
        if (connectionQuery) {
          connectionQuery
            .limit(limit)
            .offset(offset);
          return connectionQuery;
        }
        return null;
      }
    };
  }

  getAllWhere(whereArgs, args, context, ast) {
    if (!whereArgs) {
      return null;
    }

    const databaseInstance = this.tableInstance;
    const parsedAST = this.parseAST(ast);
    const sqlAST = this.generateSqlJoins(databaseInstance, args, context, parsedAST);
    const filterKeys = this.requestedFilterKeys(args.filter, sqlAST);

    whereArgs.forEach((arg) => {
      if (arg['state.id']) {
        databaseInstance.where('address.state_id', arg['state.id']);

        if (!filterKeys.has('date')) {
          databaseInstance.where('address.expired', '>=', database.raw('CURRENT_TIMESTAMP(6)'));
        } else {
          databaseInstance.where('address.created', '<=', filterKeys.get('date')['__eq']);
          databaseInstance.where('address.expired', '>=', filterKeys.get('date')['__eq']);
        }
      }
    });

    return {
      sqlAST,
      countQuery: databaseInstance.clone(),
      availableFilters: this.getAvailableFilters(parsedAST, sqlAST, context),
      availableSorts: this.getAvailableSorts(parsedAST, sqlAST, context),
      dataQuery: (limit, offset) => {
        const connectionQuery = this.generateSqlSelect(databaseInstance, parsedAST, sqlAST, args, context);
        if (connectionQuery) {
          connectionQuery
            .limit(limit)
            .offset(offset);
          return connectionQuery;
        }
        return null;
      }
    };
  }

  async findById(id, context, ast) {
    const ids = id.split(':');
    const { query, sqlAST } = this.resolveModel(this.tableInstance, {}, context, this.parseAST(ast));

    if (query) {
      const row = await query
        .where('address.id', ids[0])
        .where('address.expired', ids.splice(1).join(':'));

      if (row.length) {
        return this.treeize(row, sqlAST, context)[0];
      }
    }
    return null;
  }
}

export default new Address({ type: addressType });


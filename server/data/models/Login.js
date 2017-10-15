/* eslint-disable func-names, dot-notation, no-param-reassign, no-undef  */
import {
  fromGlobalId,
} from 'graphql-relay';
import database from '../database';
import { BaseModel } from './BaseModel';
import { loginType } from '../types';
import {
  Person,
} from './';

class Login extends BaseModel {

  sqlJoinRegistry() {
    return {
      creator: (databaseInstance, args, context, parsedAST, tableAlias, parentTableAlias) => {
        databaseInstance.leftJoin(`person as ${tableAlias}`, `${parentTableAlias}.creator_id`, `${tableAlias}.id`);

        return Person.generateSqlJoins(databaseInstance, args, context, parsedAST, tableAlias);
      },
      person: (databaseInstance, args, context, parsedAST, tableAlias, parentTableAlias) => {
        databaseInstance.leftJoin(`person as ${tableAlias}`, `${parentTableAlias}.person_id`, `${tableAlias}.id`);

        return Person.generateSqlJoins(databaseInstance, args, context, parsedAST, tableAlias);
      },
      roleConnection: () => {
      },
    };
  }

  getAll(args, context, ast) {
    const databaseInstance = this.tableInstance;
    const parsedAST = this.parseAST(ast);
    const filterKeys = this.requestedFilterKeys(args.filter, this.graphQLTypeFields);

    if (this.isUserOrGuest(context.request.user.accessLevel)) {
      const personId = fromGlobalId(context.request.user.personId).id.split(':');
      databaseInstance.whereIn('login.person_id', personId[0]);
    }

    if (filterKeys.has('date')) {
      context.date = filterKeys.get('date')['__eq'];
      databaseInstance.where('login.created', '<=', filterKeys.get('date')['__eq']);
      databaseInstance.where('login.expired', '>', filterKeys.get('date')['__eq']);
    } else {
      context.date = database.raw('CURRENT_TIMESTAMP(6)');
      databaseInstance.where('login.created', '<=', database.raw('CURRENT_TIMESTAMP(6)'));
      databaseInstance.where('login.expired', '>', database.raw('CURRENT_TIMESTAMP(6)'));
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
      if (arg['person.id']) {
        databaseInstance.where('login.person_id', arg['person.id']);
      }

      if (arg['role.id']) {
        databaseInstance.select('lr.hasRole');
        databaseInstance.leftJoin(database.raw(`(SELECT id, (IF((CONV(login.access_level , 10 , 2) & CONV(${arg['role.id']}, 10, 2) = CONV(${arg['role.id']}, 10, 2)), TRUE, FALSE)) AS hasRole FROM login) lr`), 'login.id', 'lr.id');
        databaseInstance.where('lr.hasRole', 1);
      }
    });

    if (filterKeys.has('date')) {
      databaseInstance.where('login.created', '<=', filterKeys.get('date')['__eq']);
      databaseInstance.where('login.expired', '>', filterKeys.get('date')['__eq']);
    } else if (context.date) {
      databaseInstance.where('login.created', '<=', context.date);
      databaseInstance.where('login.expired', '>', context.date);
    } else {
      databaseInstance.where('login.created', '<=', database.raw('CURRENT_TIMESTAMP(6)'));
      databaseInstance.where('login.expired', '>', database.raw('CURRENT_TIMESTAMP(6)'));
    }

    if (this.isUserOrGuest(context.request.user.accessLevel)) {
      const personId = fromGlobalId(context.request.user.personId).id.split(':');
      databaseInstance.whereIn('login.person_id', personId[0]);
    }

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
        .where('login.id', ids[0])
        .where('login.expired', ids.splice(1).join(':'));

      if (row.length) {
        return this.treeize(row, sqlAST, context)[0];
      }
    }
    return null;
  }
}

export default new Login({ type: loginType });


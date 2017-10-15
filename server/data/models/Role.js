/* eslint-disable func-names, dot-notation, no-param-reassign, no-undef  */
import { BaseModel } from './BaseModel';
import { roleType } from '../types';
import {
  Person,
} from './';

class Role extends BaseModel {

  sqlJoinRegistry() {
    return {
      creator: (databaseInstance, args, context, parsedAST, tableAlias, parentTableAlias) => {
        databaseInstance.leftJoin(`person as ${tableAlias}`, `${parentTableAlias}.creator_id`, `${tableAlias}.id`);

        return Person.generateSqlJoins(databaseInstance, args, context, parsedAST, tableAlias);
      },
      loginConnection: () => {
      },
    };
  }

  getAll(args, context, ast) {
    const databaseInstance = this.tableInstance;
    const parsedAST = this.parseAST(ast);

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

    whereArgs.forEach((arg) => {
      if (arg['login.access_level']) {
        const accessLevel = arg['login.access_level'].toString(2);
        const roles = [];
        for (let i = 0; i < accessLevel.length; i++) {
          if (parseInt(accessLevel.charAt(accessLevel.length - 1 - i), 0)) {
            roles.push(2 ** i);
          }
        }
        databaseInstance.whereIn('role.id', roles);
      }
    });

    return {
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
        .where('role.id', ids[0]);

      if (row.length) {
        return this.treeize(row, sqlAST, context)[0];
      }
    }
    return null;
  }
}

export default new Role({ type: roleType });


/* eslint-disable func-names, dot-notation, no-param-reassign, no-undef  */
import { BaseModel } from './BaseModel';
import { stateType } from '../types';
import {
  Person,
} from './';

class State extends BaseModel {

  sqlJoinRegistry() {
    return {
      creator: (databaseInstance, args, context, parsedAST, tableAlias, parentTableAlias) => {
        databaseInstance.leftJoin(`person as ${tableAlias}`, `${parentTableAlias}.creator_id`, `${tableAlias}.id`);

        return Person.generateSqlJoins(databaseInstance, args, context, parsedAST, tableAlias);
      },
      addressConnection: () => {
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

  async findById(id, context, ast) {
    const { query, sqlAST } = this.resolveModel(this.tableInstance, {}, context, this.parseAST(ast));

    if (query) {
      const row = await query.where('state.id', id);

      if (row.length) {
        return this.treeize(row, sqlAST, context)[0];
      }
    }
    return null;
  }
}

export default new State({ type: stateType });


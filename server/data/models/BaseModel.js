/* eslint-disable dot-notation */
import Treeize from 'treeize';
import set from 'lodash/set';
import cloneDeep from 'lodash/cloneDeep';
import camelCase from 'lodash/camelCase';
import astParser from '../graphQLParser';
import database, { boss } from '../database';
import { filterOperators, filterType } from '../filter';

function checkField(accessLevel, fieldPermissions, check) {
  const userGroups = accessLevel.toString(2);
  const userGroupsArray = [];

  for (let i = 0; i < userGroups.length; i++) {
    if (parseInt(userGroups.charAt(userGroups.length - 1 - i), 0)) {
      userGroupsArray.push(2 ** i);
    }
  }

  return (
    !userGroupsArray.every(userGroup => (
      !fieldPermissions.filter(fieldPermission => (
        userGroup === fieldPermission.group ? check(fieldPermission) : false
      )).length
    ))
  );
}

export const treeizeInstance = (flatData, sqlAST, context) => {
  const defaultOptions = {
    input: {
      delimiter: ':',             // delimiter between path segments, defaults to ':'
      detectCollections: false,   // when true, plural path segments become collections
      uniformRows: false,         // set to true if each row has identical signatures
    },
    output: {
      prune: false,               // remove blank/null values and empty nodes
      objectOverwrite: false,      // incoming objects will overwrite placeholder ids
      resultsAsObject: false,     // root structure defaults to array (instead of object)
    },
    log: false,                   // enable logging
  };

  const treeize = options => new Treeize(options);
  // TODO:
  // Call this function only if the permission in parsedAST
  function traversePermission(iterator, iteratorSqlAST = {
    sqlColumns: new Map(),
    sqlItemJoins: new Map(),
    sqlConnectionJoins: new Map()
  }, path, store = {}) {
    Object.keys(iterator).forEach((iteratorKey) => {
      if ((iteratorSqlAST.sqlColumns.has(iteratorKey) || iteratorSqlAST.sqlItemJoins.has(iteratorKey) || iteratorSqlAST.sqlConnectionJoins.has(iteratorKey)) && iterator[iteratorKey] === 'not_permitted') {
        store[`${path}permission.${iteratorKey}`] = { // eslint-disable-line no-param-reassign
          read: false,
          write: false,
          remove: false,
        };
      } else if (iteratorSqlAST.sqlColumns.has(iteratorKey)) {
        store[`${path}permission.${iteratorKey}`] = { // eslint-disable-line no-param-reassign
          read: true,
          write: checkField(
            context.request.user.accessLevel,
            iteratorSqlAST.sqlColumns.get(iteratorKey).permissions,
            permissionObject => permissionObject.write
          ),
          remove: checkField(
            context.request.user.accessLevel,
            iteratorSqlAST.sqlColumns.get(iteratorKey).permissions,
            permissionObject => permissionObject.remove
          ),
        };
      } else if (iteratorSqlAST.sqlItemJoins.has(iteratorKey)) {
        if (iterator[iteratorKey] && Object.keys(iterator[iteratorKey]).every(key => iterator[iteratorKey][key] !== null)) {
          traversePermission(
            iterator[iteratorKey],
            iteratorSqlAST.sqlItemJoins.get(iteratorKey).join,
            `${path}${iteratorKey}.`,
            store,
          );
        }

        store[`${path}permission.${iteratorKey}`] = { // eslint-disable-line no-param-reassign
          read: true,
          write: checkField(
            context.request.user.accessLevel,
            iteratorSqlAST.sqlItemJoins.get(iteratorKey).permissions,
            permissionObject => permissionObject.write
          ),
          remove: checkField(
            context.request.user.accessLevel,
            iteratorSqlAST.sqlItemJoins.get(iteratorKey).permissions,
            permissionObject => permissionObject.remove
          ),
        };
      } else if (iteratorSqlAST.sqlConnectionJoins.has(iteratorKey)) {
        store[`${path}permission.${iteratorKey}`] = { // eslint-disable-line no-param-reassign
          read: true,
          write: checkField(
            context.request.user.accessLevel,
            iteratorSqlAST.sqlConnectionJoins.get(iteratorKey).permissions,
            permissionObject => permissionObject.write
          ),
          remove: checkField(
            context.request.user.accessLevel,
            iteratorSqlAST.sqlConnectionJoins.get(iteratorKey).permissions,
            permissionObject => permissionObject.remove
          ),
        };
      }
    });

    return store;
  }

  const cloneFlatData = cloneDeep(flatData);

  cloneFlatData.forEach((cloneObject) => {
    Object.keys(cloneObject).forEach((cloneObjectKey) => {
      if (cloneObject[cloneObjectKey] === 'not_permitted') {
        cloneObject[cloneObjectKey] = null; // eslint-disable-line no-param-reassign
      }
    });
  });

  const treeize1 = treeize(defaultOptions);
  treeize1.grow(flatData);
  const permissionMeta = treeize1.getData().map(flatObject => traversePermission(flatObject, sqlAST, ''));

  const treeize2 = treeize(Object.assign({}, defaultOptions, {
    output: {
      prune: true,
      objectOverwrite: true,
      resultsAsObject: false,
    }
  }));
  treeize2.grow(cloneFlatData);
  const clonedGraphData = treeize2.getData();

  permissionMeta.forEach((permissionMetaObject, index) => {
    Object.keys(permissionMetaObject).forEach((key) => {
      set(clonedGraphData[index], key, permissionMetaObject[key]);
    });
  });

  return clonedGraphData;
};

const graphQLMetaFields = [
  '__type',
  '__typename',
  '__schema',
];

export class BaseModel {

  constructor({ type }) {
    this.type = type;
    this.treeize = treeizeInstance;
    this.sqlAST = this.generateGraphQLTypeFields();
  }

  /**
   * Function for defining sql joins
   * @returns {{}}
   */
  sqlJoinRegistry() {
    return {};
  }

  /**
   * Returns current graphQL type
   * @returns {*}
   */
  get graphQLType() {
    return this.type;
  }

  /**
   * Returns object with defined graphQL fields
   * @returns {{}|*}
   */
  get graphQLTypeFields() {
    return this.sqlAST;
  }

  /**
   * Returns knex db instance for current model/type
   */
  get tableInstance() {
    return this.databaseTableInstance();
  }

  isAnonymous(accessLevel) {
    const userGroups = accessLevel.toString(2);
    for (let i = 0; i < userGroups.length; i++) {
      if (parseInt(userGroups.charAt(userGroups.length - 1 - i), 0)) {
        return (2 ** i === 128);
      }
    }
    return false;
  }

  isUserOrGuest(accessLevel) {
    const userGroups = accessLevel.toString(2);
    for (let i = 0; i < userGroups.length; i++) {
      if (parseInt(userGroups.charAt(userGroups.length - 1 - i), 0)) {
        return (2 ** i >= 32 && 2 ** i <= 64);
      }
    }
    return false;
  }

  isLocationUser(accessLevel) {
    const userGroups = accessLevel.toString(2);
    for (let i = 0; i < userGroups.length; i++) {
      if (parseInt(userGroups.charAt(userGroups.length - 1 - i), 0)) {
        return (2 ** i >= 4 && 2 ** i <= 16);
      }
    }
    return false;
  }

  filterByLocation(accessLevel, columnPermissions) {
    const userGroups = accessLevel.toString(2);
    for (let i = 0; i < userGroups.length; i++) {
      if (parseInt(userGroups.charAt(userGroups.length - 1 - i), 0)) {
        const applied = columnPermissions.filter(x => x.group === 2 ** i);
        if (applied.length) {
          return (2 ** i >= 4 && 2 ** i <= 16);
        }
      }
    }
    return false;
  }

  checkReadPermission(accessLevel, sqlAST, parsedAST) {
    const clonedParsedAST = cloneDeep(parsedAST);

    const removeFields = (test1, test2, rootKey = false) => {
      Object.keys(test2).forEach((astKey) => {
        if (test1.sqlColumns.has(astKey)) {
          if (!checkField(accessLevel, test1.sqlColumns.get(astKey).permissions, permissionObject => permissionObject.read)) {
            set(clonedParsedAST, rootKey ? `${rootKey}.${astKey}` : astKey, false);
          }
        } else if (test1.sqlItemJoins.has(astKey)) {
          if (!checkField(accessLevel, test1.sqlItemJoins.get(astKey).permissions, permissionObject => permissionObject.read)) {
            set(clonedParsedAST, rootKey ? `${rootKey}.${astKey}` : astKey, false);
          } else {
            removeFields(test1.sqlItemJoins.get(astKey).join, test2[astKey], astKey);
          }
        } else if (test1.sqlConnectionJoins.has(astKey)) {
          if (!checkField(accessLevel, test1.sqlConnectionJoins.get(astKey).permissions, permissionObject => permissionObject.read)) {
            set(clonedParsedAST, rootKey ? `${rootKey}.${astKey}` : astKey, false);
          }
        }
      });
    };

    if (checkField(accessLevel, this.sqlAST.permissions, permissionObject => permissionObject.read)) {
      removeFields(sqlAST, parsedAST);
    } else {
      return {};
    }

    return clonedParsedAST;
  }

  parseAST(ast) {
    const parsedAST = cloneDeep(astParser(ast));

    (function traverseAST(rawAST) { // eslint-disable-line wrap-iife
      Object.keys(rawAST).forEach((astKey) => {
        if (rawAST[astKey] !== null && typeof rawAST[astKey] === 'object') {
          traverseAST(rawAST[astKey]);
        } else if (graphQLMetaFields.includes(astKey)) {
          delete rawAST[astKey]; // eslint-disable-line no-param-reassign
        }
      });
    })(parsedAST);

    if (parsedAST.node) {
      return parsedAST.node || {};
    } else if (parsedAST.edges) {
      return parsedAST.edges.node || {};
    }
    return parsedAST;
  }

  generateGraphQLTypeFields() {
    const { sqlDatabase, sqlTable, uniqueKey, searchKey = [], permissions, fields, ...other } = this.graphQLType._typeConfig; // eslint-disable-line no-underscore-dangle, no-unused-vars

    if (!sqlTable) {
      throw new Error(`"sqlTable" property is note defined on ${other.name} GraphQL type.`);
    }
    if (!permissions) {
      throw new Error(`"permissions" key is required but missing on ${other.name} GraphQL type.`);
    }
    if (uniqueKey) {
      if (Array.isArray(uniqueKey) && !uniqueKey.length) {
        throw new Error(`"uniqueKey" property is note defined on ${other.name} GraphQL type.`);
      }
    } else {
      throw new Error(`"uniqueKey" property is note defined on ${other.name} GraphQL type.`);
    }

    const sqlAST = {
      sqlTable,
      uniqueKey,
      searchKey,
      permissions,
      sqlColumns: new Map(),
      sqlItemJoins: new Map(),
      sqlConnectionJoins: new Map(),
    };

    if (sqlDatabase) {
      this.databaseTableInstance = () => boss(`${sqlDatabase}.${sqlTable}`);
    } else {
      this.databaseTableInstance = () => database(sqlTable);
    }

    const typeFields = fields();

    Object.keys(typeFields).forEach((filedKey) => {
      if (!typeFields[filedKey].sqlIgnore) {
        if (typeFields[filedKey].join) {
          if (typeFields[filedKey].join === 'one-to-one') {
            sqlAST.sqlItemJoins.set(filedKey, {
              permissions: typeFields[filedKey].permissions || permissions,
              filterIgnore: typeFields[filedKey].filterIgnore || false,
            });
          } else if (typeFields[filedKey].join === 'one-to-many') {
            sqlAST.sqlConnectionJoins.set(filedKey, {
              column: typeFields[filedKey].sqlColumn,
              permissions: typeFields[filedKey].permissions || permissions,
              filterIgnore: typeFields[filedKey].filterIgnore || false,
            });
          } else {
            throw new Error('"join" property on GraphQL field can only one of: one-to-one, one-to-many');
          }
        } else if (typeFields[filedKey].sqlColumn) {
          sqlAST.sqlColumns.set(filedKey, {
            column: typeFields[filedKey].sqlColumn,
            type: typeFields[filedKey].type,
            prettifiedName: typeFields[filedKey].prettifiedName ? typeFields[filedKey].prettifiedName : null,
            permissions: typeFields[filedKey].permissions || permissions,
            filterIgnore: typeFields[filedKey].filterIgnore || false,
          });
        } else {
          sqlAST.sqlColumns.set(filedKey, {
            column: filedKey,
            type: typeFields[filedKey].type,
            prettifiedName: typeFields[filedKey].prettifiedName ? typeFields[filedKey].prettifiedName : null,
            permissions: typeFields[filedKey].permissions || permissions,
            filterIgnore: typeFields[filedKey].filterIgnore || false,
          });
        }
      }
    });
    return sqlAST;
  }

  sqlIDSelect(sqlTable = this.graphQLTypeFields.sqlTable, uniqueKey = this.graphQLTypeFields.uniqueKey, columnAlias, tableAlias = this.sqlAST.sqlTable) {
    const typeName = camelCase(sqlTable);
    const modelName = typeName.charAt(0).toUpperCase() + typeName.slice(1);

    const variables = [`'${modelName}'`];

    const tableAliases = tableAlias.split('.');
    if (Array.isArray(uniqueKey)) {
      uniqueKey.forEach((item) => {
        variables.push('\':\'');
        tableAlias = ''; // eslint-disable-line no-param-reassign
        tableAliases.forEach(alias => (tableAlias = tableAlias.concat(`\`${alias}\`.`))); // eslint-disable-line
        variables.push(`${tableAlias}${item}`);
      });
    } else {
      variables.push('\':\'');
      variables.push(`\`${tableAlias}\`.${uniqueKey}`);
    }

    return database.raw(`TO_BASE64(concat(${variables.join()})) ${columnAlias ? `as '${columnAlias}'` : ''}`);
  }

  generateSqlSelect(databaseInstance, parsedAST, sqlAST, args, context) {
    const requestedTables = new Set();
    parsedAST = this.checkReadPermission(context.request.user.accessLevel, sqlAST, parsedAST); // eslint-disable-line no-param-reassign


    const appendSelect = (tableAlias, column, columnAlias) => {
      databaseInstance.select(`${tableAlias}.${column} as ${columnAlias}`);
        /* FIXME: Need to find a way to treat itemJoins differently to prevent parent nullification when child is expired
        databaseInstance.select(database.raw(`IF(\`${tableAlias}\`.created <= CURRENT_TIMESTAMP AND \`${tableAlias}\`.expired > CURRENT_TIMESTAMP,\`${tableAlias}\`.\`${column}\`, NULL) as \`${columnAlias}\``));
        */
    };

    const sqlASTToSelect = (ast, sql, selectAsKey = '', tableAlias = sqlAST.sqlTable) => {
      requestedTables.add(sql.sqlTable);

      if (!ast) {
        databaseInstance.select(database.raw(`\"not_permitted\" as \`${selectAsKey.substring(0, selectAsKey.lastIndexOf(':'))}\``)); // eslint-disable-line no-useless-escape
      } else {
        databaseInstance.select(this.sqlIDSelect(sql.sqlTable, sql.uniqueKey, `${selectAsKey}id`, tableAlias));
      }

      Object.keys(ast).forEach((columnKey) => {
        if (sql.sqlColumns.has(columnKey) && ast[columnKey] && columnKey !== 'id') {
          if (Array.isArray(sql.sqlColumns.get(columnKey).column)) {
            // if (Object.keys(ast[columnKey]).length) {
            //   sql.sqlColumns.get(columnKey).column.filter(tempColumn => Object.keys(ast[columnKey]).includes(tempColumn)).forEach((column) => {
            //     appendSelect(`${tableAlias}.${column}`, `${selectAsKey}${columnKey}:${column}`, sql);
            //   });
            // } else {
            //   sql.sqlColumns.get(columnKey).column.forEach((column) => {
            //     appendSelect(`${tableAlias}.${column}`, `${selectAsKey}${columnKey}:${column}`, sql);
            //   });
            // }
          } else {
            appendSelect(tableAlias, sql.sqlColumns.get(columnKey).column, `${selectAsKey}${columnKey}`, sql, sql.sqlColumns.get(columnKey).permissions);
          }
        } else if (sql.sqlColumns.has(columnKey) && !ast[columnKey] && columnKey !== 'id') {
          databaseInstance.select(database.raw(`\"not_permitted\" as \`${selectAsKey}${columnKey}\``)); // eslint-disable-line no-useless-escape
        }
      });
      Object.keys(ast).forEach((itemJoinKey) => {
        if (sql.sqlItemJoins.has(itemJoinKey) && sql.sqlItemJoins.get(itemJoinKey).join) {
          sqlASTToSelect(ast[itemJoinKey], sql.sqlItemJoins.get(itemJoinKey).join, `${selectAsKey}${itemJoinKey}:`, `${tableAlias}-${itemJoinKey}`);
        }
      });

      Object.keys(ast).forEach((connectionJoinKey) => {
        if (sql.sqlConnectionJoins.has(connectionJoinKey)) {
          if (Array.isArray(sql.sqlConnectionJoins.get(connectionJoinKey).column)) {
            sql.sqlConnectionJoins.get(connectionJoinKey).column.forEach((column) => {
              if (requestedTables.has(column.split('.')[0])) {
                if (!ast[connectionJoinKey]) {
                  databaseInstance.select(database.raw(`\"not_permitted\" as \`${selectAsKey}${connectionJoinKey}\``)); // eslint-disable-line no-useless-escape
                } else {
                  appendSelect(tableAlias, column.split('.').pop(), `${selectAsKey}${connectionJoinKey}+:${column}`, sql, sql.sqlConnectionJoins.get(connectionJoinKey).permissions);
                }
              }
            });
          } else if (requestedTables.has(sql.sqlConnectionJoins.get(connectionJoinKey).column.split('.')[0])) {
            if (!ast[connectionJoinKey]) {
              databaseInstance.select(database.raw(`\"not_permitted\" as \`${selectAsKey}${connectionJoinKey}\``)); // eslint-disable-line no-useless-escape
            } else {
              appendSelect(tableAlias, sql.sqlConnectionJoins.get(connectionJoinKey).column.split('.').pop(), `${selectAsKey}${connectionJoinKey}+:${sql.sqlConnectionJoins.get(connectionJoinKey).column}`, sql, sql.sqlConnectionJoins.get(connectionJoinKey).permissions);
            }
          }
        }
      });
    };

    sqlASTToSelect(parsedAST, sqlAST, '', sqlAST.sqlTable);

    return Object.keys(parsedAST).length ? databaseInstance : null;
  }

  requestedFilterKeys(filterArg, sqlAST) {
    const filterKeys = new Map();

    if (Array.isArray(filterArg)) {
      filterArg.forEach((filterItem) => {
        Object.keys(filterItem).forEach((filterKey) => {
          if (!sqlAST.sqlColumns.has(filterKey)) {
            filterKeys.set(filterKey, filterItem[filterKey]);
          }
        });
      });
    }

    return filterKeys;
  }

  requestedSortKeys(sortArg) {
    const sortKeys = new Map();

    if (Array.isArray(sortArg)) {
      sortArg.forEach((sortItem) => {
        Object.keys(sortItem).forEach((sortKey) => {
          sortKeys.set(sortKey, sortItem[sortKey]);
        });
      });
    }

    return sortKeys;
  }

  // TODO:
  // This function needs to take in consideration that it needs to sort only by the type fields
  // not on item or list join keys
  // as the sort wont work on virtual fields that have subSelection
  processSort(databaseInstance, sortArg, sqlAST, tableAlias = this.sqlAST.sqlTable) {
    if (Array.isArray(sortArg)) {
      sortArg.forEach((sortItem) => {
        Object.keys(sortItem).forEach((sortKey) => {
          if (!Array.isArray(sortItem[sortKey])) {
            if (sqlAST.sqlColumns.has(sortKey)) {
              if (sortKey === 'id') {
                if (Array.isArray(sqlAST.uniqueKey)) {
                  sqlAST.uniqueKey.forEach((pk) => {
                    databaseInstance.orderBy(`${tableAlias}.${pk}`, sortItem[sortKey]);
                  });
                } else {
                  databaseInstance.orderBy(`${tableAlias}.${sqlAST.uniqueKey}`, sortItem[sortKey]);
                }
              } else {
                databaseInstance.orderBy(`${tableAlias}.${sqlAST.sqlColumns.get(sortKey).column}`, sortItem[sortKey]);
              }
            }
          }
        });
      });
    }
  }

  processSearch(databaseInstance, searchArg, sqlAST, tableAlias = this.sqlAST.sqlTable, secondLevel = false) {
    const self = this;
    if (searchArg) {
      if (secondLevel) {
        databaseInstance.orWhere(function () { // eslint-disable-line
          sqlAST.searchKey.forEach((key) => {
            this.orWhere(database.raw(`\`${tableAlias}\`.\`${key}\` like '%${searchArg}%'`));
          });
          Object.keys(sqlAST.sqlItemJoins).forEach((key) => {
            const itemJoins = sqlAST.sqlItemJoins[key];
            itemJoins.forEach((itemJoin, itemJoinKey) => {
              if (itemJoin.join) {
                self.processSearch(this, searchArg, itemJoin.join, `${tableAlias}-${itemJoinKey}`, true);
              }
            });
          });
        });
      } else {
        databaseInstance.where(function () { // eslint-disable-line
          sqlAST.searchKey.forEach((key) => {
            this.orWhere(database.raw(`\`${tableAlias}\`.\`${key}\` like '%${searchArg}%'`));
          });
          Object.keys(sqlAST.sqlItemJoins).forEach((key) => {
            const itemJoins = sqlAST.sqlItemJoins[key];
            itemJoins.forEach((itemJoin, itemJoinKey) => {
              if (itemJoin.join) {
                self.processSearch(this, searchArg, itemJoin.join, `${tableAlias}-${itemJoinKey}`, true);
              }
            });
          });
        });
      }
    }
  }

  // TODO:
  // This function needs to take in consideration that it needs to filter only by the type fields
  // not on item or list join keys
  // as the filter wont work on virtual fields that have subSelection
  processFilter(databaseInstance, filterArg, sqlAST, tableAlias = this.sqlAST.sqlTable) {
    if (Array.isArray(filterArg)) {
      filterArg.forEach((filterItem) => {
        Object.keys(filterItem).forEach((filterKey) => {
          if (sqlAST.sqlColumns.has(filterKey)) {
            Object.keys(filterItem[filterKey]).forEach((operator) => {
              if (operator.includes('null')) {
                if (filterItem[filterKey][operator]) {
                  databaseInstance.whereNull(`${tableAlias}.${sqlAST.sqlColumns.get(filterKey).column}`);
                } else {
                  databaseInstance.whereNotNull(`${tableAlias}.${sqlAST.sqlColumns.get(filterKey).column}`);
                }
              } else if (operator.includes('li')) {
                databaseInstance.where(
                  `${tableAlias}.${sqlAST.sqlColumns.get(filterKey).column}`,
                  filterOperators[operator],
                  `%${filterItem[filterKey][operator]}%`
                );
              } else if (filterKey === 'id') {
                databaseInstance.where(
                  this.sqlIDSelect(sqlAST.sqlTable, sqlAST.uniqueKey, null, tableAlias),
                  filterOperators[operator],
                  filterItem[filterKey][operator],
                );
              } else {
                databaseInstance.where(
                  `${tableAlias}.${sqlAST.sqlColumns.get(filterKey).column}`,
                  filterOperators[operator],
                  filterItem[filterKey][operator]
                );
              }
            });
          }
        });
      });
    }
  }

  generateSqlJoins(databaseInstance, args, context, parsedAST, joinAlias = this.sqlAST.sqlTable) {
    const { sqlTable, uniqueKey, searchKey, sqlColumns, sqlItemJoins, sqlConnectionJoins } = this.sqlAST;

    let joinRegistry = null;
    const sortRegistry = new Map();
    const filterRegistry = new Map();
    const cloneSQLItemJoins = cloneDeep(sqlItemJoins);

    const includedJoins = Object.keys(parsedAST).filter(field =>
      cloneSQLItemJoins.has(field) ||
      sqlConnectionJoins.has(field)
    );

    if (args.filter && args.filter.length) {
      args.filter.forEach((filterObject) => {
        Object.keys(filterObject).forEach((filterKey) => {
          if (cloneSQLItemJoins.has(filterKey) && !includedJoins.includes(filterKey)) {
            includedJoins.push(filterKey);
          }

          filterRegistry.set(filterKey, filterObject[filterKey]);
        });
      });
    }

    if (args.sort && args.sort.length) {
      args.sort.forEach((sortObject) => {
        Object.keys(sortObject).forEach((sortKey) => {
          if (cloneSQLItemJoins.has(sortKey) && !includedJoins.includes(sortKey)) {
            includedJoins.push(sortKey);
          }

          if (sortRegistry.has(sortKey) && Array.isArray(sortRegistry.get(sortKey))) {
            sortRegistry.get(sortKey).push(...sortObject[sortKey]);
          } else if (!sortRegistry.has(sortKey)) {
            sortRegistry.set(sortKey, sortObject[sortKey]);
          }
        });
      });
    }

    if (includedJoins.length) {
      includedJoins.forEach((joinKey) => {
        joinRegistry = this.sqlJoinRegistry()[joinKey](
          databaseInstance,
          {
            sort: sortRegistry.get(joinKey) || [],
            filter: filterRegistry.get(joinKey) || [],
          },
          context,
          parsedAST[joinKey] || {},
          `${joinAlias}-${joinKey}`,
          joinAlias,
        );

        if (cloneSQLItemJoins.size && cloneSQLItemJoins.has(joinKey)) {
          cloneSQLItemJoins.set(joinKey, Object.assign(cloneSQLItemJoins.get(joinKey), { join: joinRegistry }));
          // cloneSQLItemJoins.set(joinKey, joinRegistry);
        }
      });
    }

    if (args.filter && args.filter.length) {
      this.processFilter(databaseInstance, args.filter, {
        sqlTable,
        uniqueKey,
        sqlColumns,
        sqlItemJoins: cloneSQLItemJoins,
      }, joinAlias);
    }

    if (args.sort && args.sort.length) {
      this.processSort(databaseInstance, args.sort, {
        sqlTable,
        uniqueKey,
        sqlColumns,
        sqlItemJoins: cloneSQLItemJoins,
      }, joinAlias);
    }

    if (args.search) {
      this.processSearch(databaseInstance, args.search, {
        sqlTable,
        searchKey,
        sqlItemJoins: cloneSQLItemJoins,
      }, joinAlias);
    }

    return {
      sqlTable,
      searchKey,
      uniqueKey,
      sqlColumns,
      sqlItemJoins: cloneSQLItemJoins,
      sqlConnectionJoins,
    };
  }

  setQueryDate(databaseInstance, args, context, model, joinKey, parentAlias) { // eslint-disable-line no-unused-vars
    const filterKeys = this.requestedFilterKeys(args.filter, model.graphQLTypeFields);

    if (filterKeys.has('date')) {
      databaseInstance.whereRaw(`IF(\`${joinKey}\`.id IS NULL, TRUE, \`${joinKey}\`.created <= ?)`, [filterKeys.get('date')['__eq']]);
      databaseInstance.whereRaw(`IF(\`${joinKey}\`.id IS NULL, TRUE, \`${joinKey}\`.expired > ?)`, [filterKeys.get('date')['__eq']]);
    } // eslint-disable-line brace-style
      // else if (parentAlias) {
    //   databaseInstance.whereRaw(`IF(\`${joinKey}\`.id IS NULL, TRUE, \`${joinKey}\`.created <= \`${parentAlias}\`.created)`);
    //   databaseInstance.whereRaw(`IF(\`${joinKey}\`.id IS NULL, TRUE, \`${joinKey}\`.expired > \`${parentAlias}\`.created)`);
    // }
    else if (context.date) {
      databaseInstance.whereRaw(`IF(\`${joinKey}\`.id IS NULL, TRUE, \`${joinKey}\`.created <= ?)`, [context.date]);
      databaseInstance.whereRaw(`IF(\`${joinKey}\`.id IS NULL, TRUE, \`${joinKey}\`.expired > ?)`, [context.date]);
    } else {
      databaseInstance.whereRaw(`IF(\`${joinKey}\`.id IS NULL, TRUE, \`${joinKey}\`.created <= ?)`, [database.raw('CURRENT_TIMESTAMP(6)')]);
      databaseInstance.whereRaw(`IF(\`${joinKey}\`.id IS NULL, TRUE, \`${joinKey}\`.expired > ?)`, [database.raw('CURRENT_TIMESTAMP(6)')]);
    }
  }

  getAvailableFilters(parsedAST, sqlAST, context) {
    const availableFilters = this.checkReadPermission(context.request.user.accessLevel, sqlAST, parsedAST);
    Object.keys(availableFilters).forEach((key) => {
      if (typeof availableFilters[key] === 'object' && sqlAST.sqlItemJoins.has(key)) {
        availableFilters[key] = this.getAvailableFilters(availableFilters[key], sqlAST.sqlItemJoins.get(key).join, context);
      } else if (typeof availableFilters[key] !== 'object' && availableFilters[key] && sqlAST.sqlColumns.has(key)) {
        const filterName = filterType(sqlAST.sqlColumns.get(key).type).toString();
        const prettifiedName = sqlAST.sqlColumns.get(key).prettifiedName;
        switch (filterName) {
          case 'BooleanFilter':
            availableFilters[key] = { type: 'Boolean', prettifiedName, operators: { __eq: 'equals' } };
            break;
          case 'FloatFilter':
            availableFilters[key] = {
              type: 'Number',
              prettifiedName,
              operators: {
                __eq: 'equals',
                __neq: 'not equals',
                __in: 'in',
                __nin: 'not in',
                __gt: 'greater than',
                __gte: 'greater than or equal',
                __lt: 'less than',
                __lte: 'less than or equal'
              }
            };
            break;
          case 'IDFilter':
            availableFilters[key] = {
              type: 'ID',
              prettifiedName,
              operators: { __eq: 'equals', __neq: 'not equals', __in: 'in', __nin: 'not in' }
            };
            break;
          case 'IntFilter':
            availableFilters[key] = {
              type: 'Number',
              prettifiedName,
              operators: {
                __eq: 'equals',
                __neq: 'not equals',
                __in: 'in',
                __nin: 'not in',
                __gt: 'greater than',
                __gte: 'greater than or equal',
                __lt: 'less than',
                __lte: 'less than or equal'
              }
            };
            break;
          case 'StringFilter':
            availableFilters[key] = {
              type: 'String',
              prettifiedName,
              operators: { __eq: 'is', __neq: 'is not', __in: 'in', __nin: 'not in', __li: 'like', __nli: 'not like' }
            };
            break;
          default:
            availableFilters[key] = { type: 'Custom', prettifiedName, operators: { __eq: 'equals', } };
            break;
        }
      } else if (typeof availableFilters[key] !== 'object') {
        availableFilters[key] = null;
      } else {
        delete availableFilters[key];
      }
    });

    return availableFilters;
  }

  getAvailableSorts(parsedAST, sqlAST, context) {
    const availableSorts = this.checkReadPermission(context.request.user.accessLevel, sqlAST, parsedAST);
    Object.keys(availableSorts).forEach((key) => {
      if (typeof availableSorts[key] === 'object' && sqlAST.sqlItemJoins.has(key)) {
        availableSorts[key] = this.getAvailableSorts(availableSorts[key], sqlAST.sqlItemJoins.get(key).join, context);
      } else if (typeof availableSorts[key] !== 'object' && availableSorts[key]) {
        availableSorts[key] = ['ASC', 'DESC'];
      } else if (typeof availableSorts[key] !== 'object') {
        availableSorts[key] = null;
      } else {
        delete availableSorts[key];
      }
    });

    return availableSorts;
  }

  resolveModel(databaseInstance, args, context, parsedAST, joinAlias = this.sqlAST.sqlTable) {
    const sqlAST = this.generateSqlJoins(databaseInstance, args, context, parsedAST, joinAlias);

    return {
      sqlAST,
      query: this.generateSqlSelect(databaseInstance, parsedAST, sqlAST, context)
    };
  }
}

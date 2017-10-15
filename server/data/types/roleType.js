import {
  GraphQLID,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';

import {
  connectionArgs,
  connectionDefinitions,
  fromGlobalId,
} from 'graphql-relay';

import GraphQLJSON from 'graphql-type-json';
import { nodeInterface } from '../defaultDefinitions';
import {
  totalCountType,
  connectionWithCountDefinition,
} from '../connectionDefinition';

import * as models from '../models';
import { generateSortArgs } from '../sort';
import { generateFilterArgs } from '../filter';
import {
  personType,
  queryLoginConnection,
} from './';

export const roleType = new GraphQLObjectType({
  name: 'Role',
  sqlTable: 'role',
  uniqueKey: 'id',
  searchKey: ['label'],
  permissions: [{
    group: 1,
    read: true,
    write: true,
    remove: true,
  }, {
    group: 2,
    read: true,
    write: true,
    remove: true,
  }, {
    group: 4,
    read: true,
    write: true,
    remove: true,
  }, {
    group: 8,
    read: true,
    write: true,
    remove: true,
  }, {
    group: 16,
    read: true,
    write: true,
    remove: true,
  }, {
    group: 32,
    read: true,
    write: true,
    remove: true,
  }],
  description: '',
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLID),
    },
    permission: {
      sqlIgnore: true,
      type: GraphQLJSON,
    },
    roleId: {
      sqlColumn: 'id',
      type: GraphQLInt,
    },
    label: {
      prettifiedName: 'Role',
      type: GraphQLString,
    },
    description: {
      type: GraphQLString,
    },
    created: {
      type: GraphQLString,
    },
    updated: {
      type: GraphQLString,
    },
    creator: {
      join: 'one-to-one',
      type: personType,
    },
    loginConnection: {
      join: 'one-to-many',
      sqlColumn: 'role.id',
      ...queryLoginConnection,
      resolve: (source, args, context, info) => connectionWithCountDefinition(models.Login.getAllWhere(source.loginConnection, args, context, info), args, context, info)
    },
  }),
  interfaces: () => [nodeInterface]
});

export const {
  connectionType: roleConnection,
  edgeType: roleEdge
} = connectionDefinitions({
  name: 'Role',
  nodeType: roleType,
  connectionFields: totalCountType,
});

export const queryRole = {
  type: roleType,
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  resolve: (source, args, context, info) => models.Role.findById(fromGlobalId(args.id).id, context, info),
};

export const queryRoleConnection = {
  type: roleConnection,
  args: {
    ...connectionArgs,
    ...generateSortArgs(roleType),
    ...generateFilterArgs(roleType),
    search: {
      type: GraphQLString
    }
  },
  resolve: (source, args, context, info) => connectionWithCountDefinition(models.Role.getAll(args, context, info), args, context, info)
};

export default roleType;

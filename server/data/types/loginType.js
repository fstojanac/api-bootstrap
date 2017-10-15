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
import {
  personType,
  queryRoleConnection
} from './';

import * as models from '../models';
import { generateSortArgs } from '../sort';
import { generateFilterArgs } from '../filter';

export const loginType = new GraphQLObjectType({
  name: 'Login',
  sqlTable: 'login',
  uniqueKey: ['id', 'expired'],
  searchKey: ['email'],
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
  }, {
    group: 64,
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
    loginId: {
      sqlColumn: 'id',
      type: GraphQLInt,
    },
    accessLevel: {
      sqlColumn: 'access_level',
      type: GraphQLInt,
    },
    email: {
      prettifiedName: 'Email',
      type: GraphQLString,
    },
    passwordHash: {
      sqlColumn: 'password_hash',
      type: GraphQLString,
    },
    created: {
      type: GraphQLString,
    },
    expired: {
      type: GraphQLString,
    },
    creator: {
      join: 'one-to-one',
      type: personType,
    },
    person: {
      join: 'one-to-one',
      type: personType,
    },
    roleConnection: {
      join: 'one-to-many',
      sqlColumn: 'login.access_level',
      ...queryRoleConnection,
      resolve: (source, args, context, info) => connectionWithCountDefinition(models.Role.getAllWhere(source.roleConnection, args, context, info), args, context, info)
    },
  }),
  interfaces: () => [nodeInterface]
});

export const {
  connectionType: loginConnection,
  edgeType: loginEdge
} = connectionDefinitions({
  name: 'Login',
  nodeType: loginType,
  connectionFields: totalCountType,
});

export const queryLogin = {
  type: loginType,
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  resolve: (source, args, context, info) => models.Login.findById(fromGlobalId(args.id).id, context, info),
};

export const queryLoginConnection = {
  type: loginConnection,
  args: {
    ...connectionArgs,
    ...generateSortArgs(loginType),
    ...generateFilterArgs(loginType),
    search: {
      type: GraphQLString
    }
  },
  resolve: (source, args, context, info) => connectionWithCountDefinition(models.Login.getAll(args, context, info), args, context, info)
};

export default loginType;

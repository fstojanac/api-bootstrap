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
  queryAddressConnection
} from './';

import * as models from '../models';
import { generateSortArgs } from '../sort';
import { generateFilterArgs } from '../filter';

export const stateType = new GraphQLObjectType({
  name: 'State',
  sqlTable: 'state',
  uniqueKey: 'id',
  searchKey: ['label', 'abbreviation'],
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
  }, {
    group: 128,
    read: true,
    write: false,
    remove: false,
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
    stateId: {
      sqlColumn: 'id',
      type: GraphQLInt,
    },
    label: {
      prettifiedName: 'State',
      type: GraphQLString,
    },
    abbreviation: {
      prettifiedName: 'State abbreviation',
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
    addressConnection: {
      join: 'one-to-many',
      sqlColumn: 'state.id',
      ...queryAddressConnection,
      resolve: (source, args, context, info) => connectionWithCountDefinition(models.Address.getAllWhere(source.addressConnection, args, context, info), args, context, info)

    },
  }),
  interfaces: () => [nodeInterface]
});

export const {
  connectionType: stateConnection,
  edgeType: stateEdge
} = connectionDefinitions({
  name: 'State',
  nodeType: stateType,
  connectionFields: totalCountType,
});

export const queryState = {
  type: stateType,
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  resolve: (source, args, context, info) => models.State.findById(fromGlobalId(args.id).id, context, info),
};

export const queryStateConnection = {
  type: stateConnection,
  args: {
    ...connectionArgs,
    ...generateSortArgs(stateType),
    ...generateFilterArgs(stateType),
    search: {
      type: GraphQLString
    }
  },
  resolve: (source, args, context, info) => connectionWithCountDefinition(models.State.getAll(args, context, info), args, context, info)
};

export default stateType;

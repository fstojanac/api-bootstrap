import {
  GraphQLID,
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
  addressType,
} from './';
import * as models from '../models';
import { generateSortArgs } from '../sort';
import {
  filterType,
  generateFilterArgs,
} from '../filter';

export const personAddressType = new GraphQLObjectType({
  name: 'PersonAddress',
  sqlTable: 'person_address',
  uniqueKey: ['person_id', 'address_id', 'expired'],
  searchKey: ['instructions'],
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
    instructions: {
      prettifiedName: 'Address line 2',
      type: GraphQLString,
    },
    created: {
      filterIgnore: true,
      type: GraphQLString,
    },
    expired: {
      filterIgnore: true,
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
    address: {
      join: 'one-to-one',
      type: addressType,
    },
  }),
  interfaces: () => [nodeInterface]
});

export const {
  connectionType: personAddressConnection,
  edgeType: personAddressEdge
} = connectionDefinitions({
  name: 'PersonAddress',
  nodeType: personAddressType,
  connectionFields: totalCountType,
});

export const queryPersonAddress = {
  type: personAddressType,
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  resolve: (source, args, context, info) => models.PersonAddress.findById(fromGlobalId(args.id).id, context, info),
};

export const queryPersonAddressConnection = {
  type: personAddressConnection,
  args: {
    ...connectionArgs,
    ...generateSortArgs(personAddressType),
    ...generateFilterArgs(personAddressType, {
      date: {
        type: filterType()
      },
    }),
    search: {
      type: GraphQLString
    }
  },
  resolve: (source, args, context, info) => connectionWithCountDefinition(models.PersonAddress.getAll(args, context, info), args, context, info)
};

export default personAddressType;

import {
  GraphQLID,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLFloat,
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
  stateType,
  queryPersonAddressConnection,
  queryPersonConnection,
} from './';

import * as models from '../models';
import { generateSortArgs } from '../sort';
import {
  filterType,
  generateFilterArgs,
} from '../filter';

export const addressType = new GraphQLObjectType({
  name: 'Address',
  sqlTable: 'address',
  uniqueKey: ['id', 'expired'],
  searchKey: ['address', 'city', 'zip'],
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
    addressId: {
      sqlColumn: 'id',
      type: GraphQLInt,
    },
    address: {
      prettifiedName: 'Address',
      type: GraphQLString,
    },
    city: {
      prettifiedName: 'City',
      type: GraphQLString,
    },
    zip: {
      prettifiedName: 'ZIP',
      type: GraphQLString,
    },
    latitude: {
      prettifiedName: 'Latitude',
      type: GraphQLFloat,
    },
    longitude: {
      prettifiedName: 'Longitude',
      type: GraphQLFloat,
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
    state: {
      join: 'one-to-one',
      type: stateType,
    },
    personAddressConnection: {
      description: 'All addresses assigned to any person',
      join: 'one-to-many',
      sqlColumn: 'address.id',
      ...queryPersonAddressConnection,
      resolve: (source, args, context, info) => connectionWithCountDefinition(models.PersonAddress.getAllWhere(source.personAddressConnection, args, context, info), args, context, info)
    },
    personConnection: {
      description: 'Addresses assigned as default to any person',
      join: 'one-to-many',
      sqlColumn: 'address.id',
      ...queryPersonConnection,
      resolve: (source, args, context, info) => connectionWithCountDefinition(models.Person.getAllWhere(source.personConnection, args, context, info), args, context, info)
    },
  }),
  interfaces: () => [nodeInterface]
});

export const {
  connectionType: addressConnection,
  edgeType: addressEdge
} = connectionDefinitions({
  name: 'Address',
  nodeType: addressType,
  connectionFields: totalCountType,
});

export const queryAddress = {
  type: addressType,
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  resolve: (source, args, context, info) => models.Address.findById(fromGlobalId(args.id).id, context, info),
};

export const queryAddressConnection = {
  type: addressConnection,
  args: {
    ...connectionArgs,
    ...generateSortArgs(addressType),
    ...generateFilterArgs(addressType, {
      date: {
        type: filterType()
      },
    }),
    search: {
      type: GraphQLString
    }
  },
  resolve: (source, args, context, info) => connectionWithCountDefinition(models.Address.getAll(args, context, info), args, context, info)
};

export default addressType;

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
  addressType,
  loginType,
  queryPersonAddressConnection,
} from './';

import * as models from '../models';
import { generateSortArgs } from '../sort';
import {
  filterType,
  generateFilterArgs,
} from '../filter';

export const personType = new GraphQLObjectType({
  name: 'Person',
  sqlTable: 'person',
  uniqueKey: ['id', 'expired'],
  searchKey: ['first_name', 'last_name'],
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
    personId: {
      sqlColumn: 'id',
      type: GraphQLInt,
    },
    creatorId: {
      sqlColumn: 'creator_id',
      type: GraphQLInt,
      permissions: [{
        group: 1,
        read: true,
        write: true,
        remove: true,
      }],
    },
    addressId: {
      sqlColumn: 'address_id',
      type: GraphQLInt,
    },
    firstName: {
      sqlColumn: 'first_name',
      prettifiedName: 'First name',
      type: GraphQLString,
    },
    lastName: {
      sqlColumn: 'last_name',
      prettifiedName: 'Last name',
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
    address: {
      join: 'one-to-one',
      type: addressType,
    },
    login: {
      join: 'one-to-one',
      type: loginType,
    },
    personAddressConnection: {
      join: 'one-to-many',
      sqlColumn: 'person.id',
      ...queryPersonAddressConnection,
      resolve: (source, args, context, info) => connectionWithCountDefinition(models.PersonAddress.getAllWhere(source.personAddressConnection, args, context, info), args, context, info)
    },
  }),
  interfaces: () => [nodeInterface]
});

export const {
  connectionType: personConnection,
  edgeType: personEdge
} = connectionDefinitions({
  name: 'Person',
  nodeType: personType,
  connectionFields: totalCountType,
});

export const queryPerson = {
  type: personType,
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  resolve: (source, args, context, info) => models.Person.findById(fromGlobalId(args.id).id, context, info),
};

export const queryPersonConnection = {
  type: personConnection,
  args: {
    ...connectionArgs,
    ...generateSortArgs(personType),
    ...generateFilterArgs(personType, {
      date: {
        type: filterType()
      },
    }),
    search: {
      type: GraphQLString
    }
  },
  resolve: (source, args, context, info) => connectionWithCountDefinition(models.Person.getAll(args, context, info), args, context, info)
};

export default personType;

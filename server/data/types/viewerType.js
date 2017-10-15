import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
} from 'graphql';
import {
  globalIdField,
} from 'graphql-relay';

import { nodeInterface } from '../defaultDefinitions';

import {
  queryAddress,
  queryAddressConnection,
  queryLogin,
  queryLoginConnection,
  queryPerson,
  queryPersonConnection,
  queryPersonAddress,
  queryPersonAddressConnection,
  queryRole,
  queryRoleConnection,
  queryState,
  queryStateConnection,
}
  from
    './index';

export const viewerType = new GraphQLObjectType({
  name: 'Viewer',
  fields: () => ({
    id: globalIdField('Viewer'),
    personId: {
      type: GraphQLString
    },
    accessLevel: {
      type: GraphQLInt
    },
    token: {
      type: GraphQLString
    },
    ip: {
      type: GraphQLString
    },
    address: queryAddress,
    addressConnection: queryAddressConnection,
    login: queryLogin,
    loginConnection: queryLoginConnection,
    person: queryPerson,
    personConnection: queryPersonConnection,
    personAddress: queryPersonAddress,
    personAddressConnection: queryPersonAddressConnection,
    role: queryRole,
    roleConnection: queryRoleConnection,
    state: queryState,
    stateConnection: queryStateConnection,
  }),
  interfaces: () => [nodeInterface]
});

export default viewerType;

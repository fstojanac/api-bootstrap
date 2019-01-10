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
  queryLogin,
  queryLoginConnection,
  queryPerson,
  queryPersonConnection,
  queryRole,
  queryRoleConnection,
  queryBraintree
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
    braintree: queryBraintree,
    login: queryLogin,
    loginConnection: queryLoginConnection,
    person: queryPerson,
    personConnection: queryPersonConnection,
    role: queryRole,
    roleConnection: queryRoleConnection,
  }),
  interfaces: () => [nodeInterface]
});

export default viewerType;

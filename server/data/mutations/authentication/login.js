import {
  GraphQLID,
  GraphQLNonNull,
  GraphQLString,
  GraphQLError,
} from 'graphql';
import {
  toGlobalId,
  mutationWithClientMutationId,
} from 'graphql-relay';
import bcrypt from 'bcrypt-nodejs';
import {
  viewerType
} from '../../types';
import { handleMaxPermission } from '../../../utils';
import {
  createToken,
} from '../../../utils/authentication';
import database from '../../database';
import * as models from '../../models';

export const login = mutationWithClientMutationId({
  name: 'LoginMutation',
  inputFields: {
    email: {
      type: new GraphQLNonNull(GraphQLString)
    },
    password: {
      type: new GraphQLNonNull(GraphQLString)
    },
    quoteId: {
      type: GraphQLID
    },
  },
  outputFields: {
    viewer: {
      type: viewerType,
      resolve: (payload, args, context) => models.Viewer.getViewer({ payload, args, context })
    },
  },
  mutateAndGetPayload: async ({ email, password }, context) => {
    handleMaxPermission(context.request.user.accessLevel, 128);
    let token = null;
    const loginRequest = await database('login')
      .leftJoin('person', 'login.person_id', 'person.id')
      .where('person.expired', '>=', database.raw('CURRENT_TIMESTAMP(6)'))
      .where('login.expired', '>=', database.raw('CURRENT_TIMESTAMP(6)'))
      .where({
        email
      })
      .then(res => res[0]);


    if (loginRequest && bcrypt.compareSync(password, loginRequest.password_hash)) {
      token = createToken(context.request, context.response, {
        personId: toGlobalId('Person', `${loginRequest.person_id}:${loginRequest.expired}`),
        braintreeCustomerId: loginRequest.braintree_customer_id,
        accessLevel: loginRequest.access_level,
      });
    } else {
      throw new GraphQLError('Login error: Invalid account');
    }

    return { token };
  }
});

export default login;

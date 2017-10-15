import {
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
  viewerType,
} from '../../types';
import { handleMaxPermission } from '../../../utils';
import {
  createToken,
} from '../../../utils/authentication';
import database from '../../database';
import * as models from '../../models';
import config from '../../../config/environment';

export const dashboardLogin = mutationWithClientMutationId({
  name: 'DashboardLoginMutation',
  inputFields: {
    email: {
      type: new GraphQLNonNull(GraphQLString)
    },
    password: {
      type: new GraphQLNonNull(GraphQLString)
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
    if (email === config.systemUser.email && password === config.systemUser.password) {
      token = createToken(context.request, context.response, {
        personId: toGlobalId('Person', '0:9999-12-31 23:59:59.000000'),
        accessLevel: 1,
      });

      return { token };
    }

    const loginRequest = await database
      .from('login')
      .leftJoin('person', 'login.person_id', 'person.id')
      .where('person.expired', '>=', database.raw('CURRENT_TIMESTAMP(6)'))
      .where('login.expired', '>=', database.raw('CURRENT_TIMESTAMP(6)'))
      .where({
        email
      })
      .where('login.access_level', '<', 32)
      .then(res => res[0]);


    if (loginRequest && bcrypt.compareSync(password, loginRequest.password_hash)) {
      token = createToken(context.request, context.response, {
        personId: toGlobalId('Person', `${loginRequest.person_id}:${loginRequest.expired}`),
        accessLevel: loginRequest.access_level,
      });
    } else {
      throw new GraphQLError('Login error: Invalid account');
    }

    return { token };
  }
});

export default dashboardLogin;

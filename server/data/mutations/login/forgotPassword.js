/* eslint-disable no-param-reassign */
import {
  GraphQLNonNull,
  GraphQLString,
  GraphQLError,
} from 'graphql';

import {
  mutationWithClientMutationId,
  offsetToCursor,
  toGlobalId,
  fromGlobalId,
} from 'graphql-relay';

import { handleMaxPermission } from '../../../utils';
import database from '../../database';
import * as models from '../../models';
import {
  loginType,
  loginEdge,
  viewerType,
} from '../../types';

export const forgotPassword = mutationWithClientMutationId({
  name: 'ForgotPasswordMutation',
  inputFields: {
    email: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    login: {
      type: loginType,
      resolve: async (payload, args, context, ast) => models.Login.findById(payload.id, context, ast)
    },
    viewer: {
      type: viewerType,
      resolve: (payload, args, context, ast) => models.Viewer.getViewer({ payload, args, context, ast })
    },
    loginEdge: {
      type: loginEdge,
      resolve: async (payload, args, context, ast) => {
        const totalCount = await database
          .where(models.Login.sqlIDSelect(), '<=', toGlobalId('Login', payload.id))
          .from('login')
          .count('* as totalCount')
          .then(res => res[0].totalCount);
        return {
          cursor: offsetToCursor(totalCount),
          node: models.Login.findById(payload.id, context, ast),
        };
      }
    }
  },
  mutateAndGetPayload: async ({ email }, context) => {
    handleMaxPermission(context.request.user.accessLevel, 128);
    const selectedLogin = await database('login')
      .select('*')
      .where({ email })
      .where('login.expired', '>', database.raw('CURRENT_TIMESTAMP(6)'))
      .then(res => res[0]);

    if (selectedLogin) {
      selectedLogin.creator_id = context.request.user.personId ? fromGlobalId(context.request.user.personId).id.split(':')[0] : null;
      selectedLogin.reset_password = 1;
      selectedLogin.created = database.raw('CURRENT_TIMESTAMP(6)');
      selectedLogin.expired = database.raw('DATE_ADD(CURRENT_TIMESTAMP(6), INTERVAL 1 HOUR)');

      await database('login')
        .where({ id: selectedLogin.id, reset_password: 0 })
        .where('login.expired', '>', database.raw('CURRENT_TIMESTAMP(6)'))
        .update({ expired: database.raw('CURRENT_TIMESTAMP(6)') });

      await database('login')
        .where({ id: selectedLogin.id, reset_password: 1 })
        .where('login.expired', '>', database.raw('CURRENT_TIMESTAMP(6)'))
        .update({ expired: database.raw('CURRENT_TIMESTAMP(6)') });

      await database('login').insert(selectedLogin);

      selectedLogin.creator_id = context.request.user.personId ? fromGlobalId(context.request.user.personId).id.split(':')[0] : null;
      selectedLogin.reset_password = 0;
      selectedLogin.created = database.raw('DATE_ADD(CURRENT_TIMESTAMP(6), INTERVAL 1 HOUR)');
      selectedLogin.expired = '9999-12-31 23:59:59.000000';

      await database('login').insert(selectedLogin);
    } else {
      throw new GraphQLError('Invalid account');
    }

    const payload = await database('login')
      .where({ id: selectedLogin.id })
      .where('login.expired', '>', database.raw('CURRENT_TIMESTAMP(6)'))
      .then(res => res[0]);

    const loginId = ''.concat(payload.id, ':', payload.expired);

    return { id: loginId };
  }
});

export default forgotPassword;

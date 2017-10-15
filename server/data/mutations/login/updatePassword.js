/* eslint-disable no-param-reassign */
import {
  GraphQLNonNull,
  GraphQLID,
  GraphQLString,
} from 'graphql';

import {
  mutationWithClientMutationId,
  offsetToCursor,
  toGlobalId,
  fromGlobalId,
} from 'graphql-relay';

import bcrypt from 'bcrypt-nodejs';
import { handleMaxPermission } from '../../../utils';
import database from '../../database';
import * as models from '../../models';
import {
  loginType,
  loginEdge,
  viewerType,
} from '../../types';

export const updatePassword = mutationWithClientMutationId({
  name: 'UpdatePasswordMutation',
  inputFields: {
    loginId: {
      type: new GraphQLNonNull(GraphQLID),
    },
    password: {
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
  mutateAndGetPayload: async ({ loginId, password }, context) => {
    handleMaxPermission(context.request.user.accessLevel, 128);
    const loginIds = fromGlobalId(loginId).id.split(':');
    loginId = loginIds[0];

    const selectedLogin = await database('login')
      .select('*')
      .where({ id: loginId })
      .where('login.expired', '>', database.raw('CURRENT_TIMESTAMP(6)'))
      .then(res => res[0]);

    if (selectedLogin) {
      const passwordHash = bcrypt.hashSync(password);
      selectedLogin.creator_id = context.request.user.personId ? fromGlobalId(context.request.user.personId).id.split(':')[0] : null;
      selectedLogin.password_hash = passwordHash || selectedLogin.password_hash;
      selectedLogin.created = database.raw('CURRENT_TIMESTAMP(6)');

      await database('login')
        .where({ id: selectedLogin.id })
        .where('login.expired', '>', database.raw('CURRENT_TIMESTAMP(6)'))
        .update({ expired: database.raw('CURRENT_TIMESTAMP(6)') });

      await database('login').insert(selectedLogin);
    }

    const payload = await database('login')
      .where({ id: selectedLogin.id })
      .where('login.expired', '>', database.raw('CURRENT_TIMESTAMP(6)'))
      .then(res => res[0]);

    loginId = ''.concat(payload.id, ':', payload.expired);

    return { id: loginId };
  }
});

export default updatePassword;

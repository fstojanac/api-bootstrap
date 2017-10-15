/* eslint-disable no-param-reassign */
import {
  GraphQLNonNull,
  GraphQLID,
  GraphQLError,
} from 'graphql';

import {
  mutationWithClientMutationId,
  offsetToCursor,
  toGlobalId,
  fromGlobalId,
} from 'graphql-relay';

import database from '../../database';
import { handleMaxPermission } from '../../../utils';
import * as models from '../../models';
import {
  loginType,
  loginEdge,
  personType,
  personEdge,
  viewerType,
} from '../../types';

export const deactivateEmployee = mutationWithClientMutationId({
  name: 'DeactivateEmployeeMutation',
  inputFields: {
    loginId: {
      type: new GraphQLNonNull(GraphQLID),
    },
  },
  outputFields: {
    removedLoginId: {
      type: GraphQLID,
      resolve: payload => toGlobalId('Login', payload.loginId)
    },
    login: {
      type: loginType,
      resolve: async (payload, args, context, ast) => models.Login.findById(payload.loginId, context, ast)
    },
    person: {
      type: personType,
      resolve: async (payload, args, context, ast) => models.Person.findById(payload.id, context, ast)
    },
    viewer: {
      type: viewerType,
      resolve: (payload, args, context, ast) => models.Viewer.getViewer({ payload, args, context, ast })
    },
    personEdge: {
      type: personEdge,
      resolve: async (payload, args, context, ast) => {
        const totalCount = await database
          .where(models.Person.sqlIDSelect(), '<=', toGlobalId('Person', payload.id))
          .from('person')
          .count('* as totalCount')
          .then(res => res[0].totalCount);
        return {
          cursor: offsetToCursor(totalCount),
          node: models.Person.findById(payload.id, context, ast),
        };
      }
    },
    loginEdge: {
      type: loginEdge,
      resolve: async (payload, args, context, ast) => {
        const totalCount = await database
          .where(models.Login.sqlIDSelect(), '<=', toGlobalId('Login', payload.loginId))
          .from('login')
          .count('* as totalCount')
          .then(res => res[0].totalCount);
        return {
          cursor: offsetToCursor(totalCount),
          node: models.Login.findById(payload.loginId, context, ast),
        };
      }
    }
  },
  mutateAndGetPayload: async ({ loginId }, context) => {
    handleMaxPermission(context.request.user.accessLevel, 8);
    const loginIds = fromGlobalId(loginId).id.split(':');
    loginId = loginIds[0];

    const selectedLogin = await database('login')
      .where('login.id', loginId)
      .where('login.expired', '>', database.raw('CURRENT_TIMESTAMP(6)'))
      .orderBy('login.expired', 'DESC')
      .then(res => res[0]);

    if (!selectedLogin) {
      throw new GraphQLError('Account doesn\'t exists');
    }

    selectedLogin.creator_id = context.request.user.personId ? fromGlobalId(context.request.user.personId).id.split(':')[0] : null;
    selectedLogin.access_level = 32;
    selectedLogin.created = database.raw('CURRENT_TIMESTAMP(6)');

    await database('login')
      .update({ expired: database.raw('CURRENT_TIMESTAMP(6)') })
      .where('login.id', selectedLogin.id)
      .where('login.expired', '>', database.raw('CURRENT_TIMESTAMP(6)'))
      .where('login.reset_password', 1)
      .then(res => res);

    await database('login')
      .update({ expired: database.raw('CURRENT_TIMESTAMP(6)') })
      .where('login.id', selectedLogin.id)
      .where('login.expired', '>', database.raw('CURRENT_TIMESTAMP(6)'))
      .where('login.reset_password', 0)
      .then(res => res);

    await database('login').insert(selectedLogin).then(res => res);

    const payload = await database('person')
      .where({ id: selectedLogin.person_id })
      .where('expired', '>', database.raw('CURRENT_TIMESTAMP(6)'))
      .then(res => res[0]);
    const loginPayload = await database('login')
      .where({ id: selectedLogin.id })
      .where('expired', '>', database.raw('CURRENT_TIMESTAMP(6)'))
      .then(res => res[0]);

    let id = '';
    id = id.concat(payload.id, ':', payload.expired);
    loginId = '';
    loginId = loginId.concat(loginPayload.id, ':', loginPayload.expired);

    return { id, loginId };
  }
});

export default deactivateEmployee;

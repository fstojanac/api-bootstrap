import {
  GraphQLNonNull,
  GraphQLID,
  GraphQLError,
} from 'graphql';
import {
  toGlobalId,
  fromGlobalId,
  mutationWithClientMutationId,
} from 'graphql-relay';
import {
  viewerType,
} from '../../types';
import { handleMaxPermission } from '../../../utils';
import {
  createToken,
} from '../../../utils/authentication';
import database from '../../database';
import * as models from '../../models';

export const guestLogin = mutationWithClientMutationId({
  name: 'GuestLoginMutation',
  inputFields: {
    personId: {
      type: new GraphQLNonNull(GraphQLID)
    },
  },
  outputFields: {
    viewer: {
      type: viewerType,
      resolve: (payload, args, context) => models.Viewer.getViewer({ payload, args, context })
    },
  },
  mutateAndGetPayload: async ({ personId }, context) => {
    handleMaxPermission(context.request.user.accessLevel, 128);
    const personIds = fromGlobalId(personId).id.split(':');
    personId = personIds[0]; // eslint-disable-line no-param-reassign
    const personExpired = personIds.splice(1).join(':');

    let token = null;
    const loginRequest = await database
      .from('person')
      .where('person.id', personId)
      .where('person.expired', '>=', database.raw('CURRENT_TIMESTAMP(6)'))
      .then(res => res[0]);

    if (loginRequest) {
      token = createToken(context.request, context.response, {
        personId: toGlobalId('Person', `${personId}:${personExpired}`),
        accessLevel: 64,
      });
    } else {
      throw new GraphQLError('Login error: User not authorized');
    }

    return { token };
  }
});

export default guestLogin;

import {
  GraphQLString,
} from 'graphql';
import {
  mutationWithClientMutationId,
} from 'graphql-relay';
import {
  createAnonymousToken,
} from '../../../utils/authentication';
import {
  viewerType,
} from '../../types';
import * as models from '../../models';

export const logout = mutationWithClientMutationId({
  name: 'LogoutMutation',
  inputFields: {
    id: {
      type: GraphQLString
    }
  },
  outputFields: {
    viewer: {
      type: viewerType,
      resolve: (payload, args, context) => models.Viewer.getViewer({ payload, args, context })
    },
  },
  mutateAndGetPayload: async (args, context) => ({
    token: createAnonymousToken(context.request, context.response),
  })
});

export default logout;

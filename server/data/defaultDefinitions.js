import {
  fromGlobalId,
  nodeDefinitions,
} from 'graphql-relay';
import {
  GraphQLError
} from 'graphql';

import * as models from './models';

/**
 * We get the node interface and field from the Relay library.
 *
 * The first method defines the way we resolve an ID to its object.
 * The second defines the way we resolve an object to its GraphQL type.
 */
export const { nodeInterface, nodeField } = nodeDefinitions(
  async (globalId, context, info) => { // eslint-disable-line no-unused-vars
    const { type, id } = fromGlobalId(globalId);
    if (!type || !id) {
      return null;
    }

    if (models[type]) {
      const node = type === 'Viewer' ? models[type].getViewer({
        context,
        info
      }) : await models[type].findById(id, context, info);

      if (node) {
        return { ...node, type: models[type].graphQLType };
      }
      return null;
    }

    throw new GraphQLError('No such type!');
  },
  (obj) => {
    if (obj && obj.type) {
      return obj.type;
    }

    return null;
  }
);

/* eslint-disable no-param-reassign */
import {
  GraphQLNonNull,
  GraphQLID,
  GraphQLFloat,
  GraphQLString,
  GraphQLError
} from 'graphql';

import {
  mutationWithClientMutationId,
  offsetToCursor,
  toGlobalId,
  fromGlobalId,
} from 'graphql-relay';

import database from '../../database';
import { toTitleCase, handleMaxPermission } from '../../../utils';
import * as models from '../../models';
import {
  addressType,
  addressEdge,
  viewerType,
} from '../../types';

export const createAddress = mutationWithClientMutationId({
  name: 'CreateAddressMutation',
  inputFields: {
    address: {
      type: new GraphQLNonNull(GraphQLString),
    },
    city: {
      type: new GraphQLNonNull(GraphQLString),
    },
    stateLabel: {
      type: GraphQLString,
    },
    stateId: {
      type: GraphQLID,
    },
    zip: {
      type: new GraphQLNonNull(GraphQLString),
    },
    longitude: {
      type: GraphQLFloat,
    },
    latitude: {
      type: GraphQLFloat,
    },
  },
  outputFields: {
    address: {
      type: addressType,
      resolve: async (payload, args, context, ast) => models.Address.findById(payload.id, context, ast)
    },
    viewer: {
      type: viewerType,
      resolve: (payload, args, context, ast) => models.Viewer.getViewer({ payload, args, context, ast })
    },
    addressEdge: {
      type: addressEdge,
      resolve: async (payload, args, context, ast) => {
        const totalCount = await database
          .where(models.Address.sqlIDSelect(), '<=', toGlobalId('Address', payload.id))
          .from('address')
          .count('* as totalCount')
          .then(res => res[0].totalCount);
        return {
          cursor: offsetToCursor(totalCount),
          node: models.Address.findById(payload.id, context, ast),
        };
      }
    }
  },
  mutateAndGetPayload: async ({ address, city, stateId, stateLabel, zip, latitude, longitude }, context) => {
    handleMaxPermission(context.request.user.accessLevel, 128);
    let stateIds = null;

    if (stateId) {
      stateIds = fromGlobalId(stateId).id.split(':');
      stateId = stateIds[0];
    } else {
      stateId = await database('state')
        .select('id')
        .where('label', stateLabel)
        .then(res => (res[0] ? res[0].id : null));
    }

    if (stateId === null || stateId === undefined) throw new GraphQLError('State is a required field.');

    address = toTitleCase(address);
    city = toTitleCase(city);

    let selected = await database('address')
      .select('address.id')
      .where({ address, city, state_id: stateId, zip })
      .then((res) => {
        if (!res[0]) {
          return null;
        }
        return res[0].id;
      });

    if (!selected) {
      selected = await database('address').insert({
        creator_id: context.request.user.personId ? fromGlobalId(context.request.user.personId).id.split(':')[0] : null,
        address,
        city,
        state_id: stateId,
        zip,
        latitude,
        longitude,
      }).then(res => res[0]);
    }

    const payload = await database('address')
      .where({ id: selected })
      .where('expired', '>', database.raw('CURRENT_TIMESTAMP(6)'))
      .then(res => res[0]);

    let id = '';
    id = id.concat(payload.id, ':', payload.expired);

    return { id };
  }
});

export default createAddress;

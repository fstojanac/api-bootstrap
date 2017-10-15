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

import { handleMaxPermission } from '../../../utils';
import database from '../../database';
import * as models from '../../models';
import {
  personType,
  personEdge,
  viewerType,
} from '../../types';

export const createPerson = mutationWithClientMutationId({
  name: 'CreatePersonMutation',
  inputFields: {
    addressId: {
      type: GraphQLID,
    },
    firstName: {
      type: new GraphQLNonNull(GraphQLString),
    },
    lastName: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    personId: {
      type: GraphQLID,
      resolve: async payload => toGlobalId('Person', payload.id)
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
    }
  },
  mutateAndGetPayload: async ({ addressId, firstName, lastName }, context) => {
    handleMaxPermission(context.request.user.accessLevel, 128);
    if (addressId) {
      const addressIds = fromGlobalId(addressId).id.split(':');
      addressId = addressIds[0];
    }

    const inserted = await database('person').insert({
      creator_id: context.request.user.personId ? fromGlobalId(context.request.user.personId).id.split(':')[0] : null,
      address_id: addressId || null,
      first_name: firstName,
      last_name: lastName,
    }).then(res => res[0]);

    const payload = await database('person')
      .where({ id: inserted })
      .where('expired', '>', database.raw('CURRENT_TIMESTAMP(6)'))
      .then(res => res[0]);

    let id = '';
    id = id.concat(payload.id, ':', payload.expired);

    return { id };
  }
});

export default createPerson;

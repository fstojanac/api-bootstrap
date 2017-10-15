/* eslint-disable no-param-reassign */
import {
  GraphQLNonNull,
  GraphQLID,
  GraphQLFloat,
  GraphQLString,
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
  personAddressType,
  personAddressEdge,
  viewerType,
  personType,
} from '../../types';

export const createPersonAddress = mutationWithClientMutationId({
  name: 'CreatePersonAddressMutation',
  inputFields: {
    personId: {
      type: new GraphQLNonNull(GraphQLID),
    },
    addressId: {
      type: GraphQLID
    },
    address: {
      type: GraphQLString,
    },
    city: {
      type: GraphQLString,
    },
    stateId: {
      type: GraphQLID,
    },
    zip: {
      type: GraphQLString,
    },
    longitude: {
      type: GraphQLFloat,
    },
    latitude: {
      type: GraphQLFloat,
    },
    instructions: {
      type: GraphQLString,
    },
  },
  outputFields: {
    personAddress: {
      type: personAddressType,
      resolve: async (payload, args, context, ast) => models.PersonAddress.findById(payload.id, context, ast)
    },
    viewer: {
      type: viewerType,
      resolve: (payload, args, context, ast) => models.Viewer.getViewer({ payload, args, context, ast })
    },
    person: {
      type: personType,
      resolve: (payload, args, context, ast) => models.Person.findById(payload.payloadPersonId, context, ast)
    },
    personAddressEdge: {
      type: personAddressEdge,
      resolve: async (payload, args, context, ast) => {
        const totalCount = await database
          .where(models.PersonAddress.sqlIDSelect(), '<=', toGlobalId('PersonAddress', payload.id))
          .from('person_address')
          .count('* as totalCount')
          .then(res => res[0].totalCount);
        return {
          cursor: offsetToCursor(totalCount),
          node: models.Address.findById(payload.id, context, ast),
        };
      }
    }
  },
  mutateAndGetPayload: async ({ personId, addressId, address, city, stateId, zip, latitude, longitude, instructions }, context) => {
    handleMaxPermission(context.request.user.accessLevel, 128);
    const personIds = fromGlobalId(personId).id.split(':');
    personId = personIds[0];

    if (addressId) {
      const addressIds = fromGlobalId(addressId).id.split(':');
      addressId = addressIds[0];
    }

    if (stateId) {
      const stateIds = fromGlobalId(stateId).id.split(':');
      stateId = stateIds[0];
    }

    let selectedAddress = null;
    if (addressId) {
      selectedAddress = addressId;
    } else {
      selectedAddress = await database('address')
        .select('address.id')
        .where({ address, city, state_id: stateId, zip })
        .then((res) => {
          if (!res[0]) {
            return null;
          }
          return res[0].id;
        });
    }


    if (!selectedAddress) {
      selectedAddress = await database('address').insert({
        creator_id: context.request.user.personId ? fromGlobalId(context.request.user.personId).id.split(':')[0] : null,
        address: toTitleCase(address),
        city: toTitleCase(city),
        state_id: stateId,
        zip,
        latitude,
        longitude,
      }).then(res => res[0]);
    }

    const activeAddressId = await database('address')
      .where({ id: selectedAddress })
      .where('expired', '>', database.raw('CURRENT_TIMESTAMP(6)'))
      .then(res => res[0].id);

    const activePersonAddress = await database('person_address')
      .where({ person_id: personId, address_id: activeAddressId })
      .where('expired', '>', database.raw('CURRENT_TIMESTAMP(6)'))
      .then(res => res[0]);

    if (activePersonAddress) {
      await database('person_address')
        .where({ person_id: personId, address_id: activeAddressId })
        .where('expired', '>', database.raw('CURRENT_TIMESTAMP(6)'))
        .update({ expired: database.raw('CURRENT_TIMESTAMP(6)') });
    }

    await database('person_address')
      .insert({
        creator_id: context.request.user.personId ? fromGlobalId(context.request.user.personId).id.split(':')[0] : null,
        person_id: personId,
        address_id: activeAddressId,
        instructions
      });

    const payload = await database('person_address')
      .where({ person_id: personId, address_id: activeAddressId })
      .where('expired', '>', database.raw('CURRENT_TIMESTAMP(6)'))
      .then(res => res[0]);

    let id = '';
    id = id.concat(payload.person_id, ':', payload.address_id, ':', payload.expired);
    const payloadPersonId = ''.concat(payload.person_id, ':', payload.expired);


    return { id, payloadPersonId };
  }
});

export default createPersonAddress;

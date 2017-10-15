/* eslint-disable no-param-reassign */
import {
  GraphQLNonNull,
  GraphQLID
} from 'graphql';

import {
  mutationWithClientMutationId,
  fromGlobalId,
  toGlobalId,
} from 'graphql-relay';

import { handleMaxPermission } from '../../../utils';
import database from '../../database';
import * as models from '../../models';
import {
  viewerType,
  personType,
  addressType,
} from '../../types';

export const removePersonAddress = mutationWithClientMutationId({
  name: 'RemovePersonAddressMutation',
  inputFields: {
    personAddressId: {
      type: new GraphQLNonNull(GraphQLID),
    },
  },
  outputFields: {
    viewer: {
      type: viewerType,
      resolve: (payload, args, context, ast) => models.Viewer.getViewer({ payload, args, context, ast })
    },
    person: {
      type: personType,
      resolve: (payload, args, context, ast) => models.Person.findById(payload.payloadPersonId, context, ast)
    },
    address: {
      type: addressType,
      resolve: (payload, args, context, ast) => models.Address.findById(payload.payloadAddressId, context, ast)
    },
    removedPersonAddressId: {
      type: new GraphQLNonNull(GraphQLID),
      resolve: payload => payload.id
    }
  },
  mutateAndGetPayload: async ({ personAddressId }, context) => {
    handleMaxPermission(context.request.user.accessLevel, 128);
    const personAddressIds = fromGlobalId(personAddressId).id.split(':');
    const personId = personAddressIds[0];
    const addressId = personAddressIds[1];
    const personAddressExpired = personAddressIds.splice(2).join(':');

    const activePersonAddress = await database('person_address')
      .where({ person_id: personId, address_id: addressId })
      .where('expired', '>', database.raw('CURRENT_TIMESTAMP(6)'))
      .then(res => res[0]);

    if (activePersonAddress) {
      await database('person_address')
        .where({ person_id: personId, address_id: addressId })
        .where('expired', '>', database.raw('CURRENT_TIMESTAMP(6)'))
        .update({ expired: database.raw('CURRENT_TIMESTAMP(6)') });
    }

    const payload = await database('person_address')
      .where({ person_id: personId, address_id: addressId })
      .orderBy('person_address.expired', 'DESC')
      .then(res => res[0]);

    let id = '';
    id = id.concat(payload.person_id, ':', payload.address_id, ':', personAddressExpired);
    const payloadPersonId = personId.concat(':', personAddressExpired);
    const payloadAddressId = addressId.concat(':', personAddressExpired);

    return { id: toGlobalId('PersonAddress', id), payloadPersonId, payloadAddressId };
  }
});

export default removePersonAddress;

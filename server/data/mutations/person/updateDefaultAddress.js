/* eslint-disable no-param-reassign */
import {
  GraphQLNonNull,
  GraphQLID,
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

export const updateDefaultAddress = mutationWithClientMutationId({
  name: 'UpdateDefaultAddressMutation',
  inputFields: {
    personId: {
      type: new GraphQLNonNull(GraphQLID),
    },
    addressId: {
      type: new GraphQLNonNull(GraphQLID),
    },
  },
  outputFields: {
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
  mutateAndGetPayload: async ({ personId, addressId }, context) => {
    handleMaxPermission(context.request.user.accessLevel, 32);
    const personIds = fromGlobalId(personId).id.split(':');
    personId = personIds[0];
    const personExpired = personIds.splice(1).join(':');

    const addressIds = fromGlobalId(addressId).id.split(':');
    addressId = addressIds[0];


    const selectedAddress = await database('address')
      .select('*')
      .where({ id: addressId })
      .where('expired', '>', database.raw('CURRENT_TIMESTAMP(6)'))
      .then(res => res[0]);
    const selectedPerson = await database('person')
      .select('*')
      .where({ id: personId, expired: personExpired })
      .then(res => res[0]);


    const activePerson = await database('person')
      .where({ id: personId })
      .where('expired', '>', database.raw('CURRENT_TIMESTAMP(6)'))
      .then(res => res[0]);


    if (selectedAddress && selectedPerson) {
      selectedPerson.creator_id = context.request.user.personId ? fromGlobalId(context.request.user.personId).id.split(':')[0] : null;
      selectedPerson.address_id = selectedAddress.id;
      selectedPerson.created = database.raw('CURRENT_TIMESTAMP(6)');
      selectedPerson.expired = database.raw('CURRENT_TIMESTAMP(6)');

      if (activePerson) {
        await database('person')
          .where({ id: activePerson.id, expired: activePerson.expired })
          .update({ expired: database.raw('CURRENT_TIMESTAMP(6)') });

        selectedPerson.expired = activePerson.expired;
      }

      await database('person').insert(selectedPerson);
    }

    const payload = await database('person')
      .where({ id: selectedPerson.id })
      .where('expired', '>', database.raw('CURRENT_TIMESTAMP(6)'))
      .then(res => res[0]);

    let id = '';
    id = id.concat(payload.id, ':', payload.expired);

    return { id };
  }
});

export default updateDefaultAddress;

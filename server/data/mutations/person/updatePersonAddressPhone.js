/* eslint-disable no-param-reassign */
import {
  GraphQLNonNull,
  GraphQLID,
  GraphQLString,
  GraphQLFloat,
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

export const updatePersonAddressPhone = mutationWithClientMutationId({
  name: 'UpdatePersonAddressPhoneMutation',
  inputFields: {
    personId: {
      type: new GraphQLNonNull(GraphQLID),
    },
    addressId: {
      type: GraphQLID,
    },
    firstName: {
      type: GraphQLString,
    },
    lastName: {
      type: GraphQLString,
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
    instructions: {
      type: GraphQLString,
    },
    longitude: {
      type: GraphQLFloat,
    },
    latitude: {
      type: GraphQLFloat,
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
  mutateAndGetPayload: async ({ personId, addressId, firstName, lastName, address, city, stateId, zip, instructions, latitude, longitude }, context) => {
    handleMaxPermission(context.request.user.accessLevel, 128);
    const personIds = fromGlobalId(personId).id.split(':');
    personId = personIds[0];
    const personExpired = personIds.splice(1).join(':');


    const selectedPerson = await database('person')
      .select('*')
      .where({ id: personId, expired: personExpired })
      .then(res => res[0]);

    let selectedPersonAddress = null;
    let selectedAddress = null;
    let addressExpired = null;
    if (addressId) {
      const addressIds = fromGlobalId(addressId).id.split(':');
      addressId = addressIds[0];
      addressExpired = addressIds.splice(1).join(':');
      selectedAddress = await database('address')
        .select('*')
        .where({ id: addressId, expired: addressExpired })
        .then(res => res[0]);

      selectedPersonAddress = await database('person_address')
        .select('*')
        .where({ person_id: personId, address_id: addressId, expired: personExpired })
        .then(res => res[0]);
    }

    if (stateId) {
      const stateIds = fromGlobalId(stateId).id.split(':');
      stateId = stateIds[0];
    }
    const activePerson = await database('person')
      .where({ id: personId })
      .where('expired', '>', database.raw('CURRENT_TIMESTAMP(6)'))
      .then(res => res[0]);

    let insertedAddress = null;
    if (selectedAddress || !addressId) {
      if (!selectedAddress && address && city && stateId && latitude !== undefined && longitude !== undefined) {
        selectedAddress = {};

        selectedAddress.address = address || selectedAddress.address;
        selectedAddress.city = city || selectedAddress.city;
        selectedAddress.state_id = stateId || selectedAddress.state_id;
        selectedAddress.zip = zip || selectedAddress.zip;
        selectedAddress.latitude = latitude || selectedAddress.latitude;
        selectedAddress.longitude = longitude || selectedAddress.longitude;
        selectedAddress.created = database.raw('CURRENT_TIMESTAMP(6)');
        selectedAddress.expired = database.raw('CURRENT_TIMESTAMP(6)');

        insertedAddress = await database('address')
          .select('address.id')
          .where({ address: selectedAddress.address, city: selectedAddress.city, state_id: selectedAddress.state_id, zip: selectedAddress.zip })
          .then((res) => {
            if (!res[0]) {
              return null;
            }
            return res[0].id;
          });

        if (!insertedAddress && selectedAddress) {
          insertedAddress = await database('address').insert({
            creator_id: context.request.user.personId ? fromGlobalId(context.request.user.personId).id.split(':')[0] : null,
            address: selectedAddress.address,
            city: selectedAddress.city,
            state_id: selectedAddress.state_id,
            zip: selectedAddress.zip,
            latitude: selectedAddress.latitude,
            longitude: selectedAddress.longitude
          }).then(res => res[0]);
        }
      } else if (selectedAddress) {
        insertedAddress = selectedAddress.id;
      }
    }

    if (selectedPersonAddress) {
      selectedPersonAddress.instructions = instructions || selectedPersonAddress.instructions;
      selectedPersonAddress.created = database.raw('CURRENT_TIMESTAMP(6)');
      selectedPersonAddress.expired = database.raw('CURRENT_TIMESTAMP(6)');

      const activePersonAddress = await database('person_address')
        .where({ person_id: personId, address_id: addressId })
        .where('expired', '>', database.raw('CURRENT_TIMESTAMP(6)'))
        .then(res => res[0]);

      if (activePersonAddress) {
        await database('person_address')
          .where({ person_id: activePersonAddress.person_id, address_id: activePersonAddress.address_id, expired: activePersonAddress.expired })
          .update({ expired: database.raw('CURRENT_TIMESTAMP(6)') });

        selectedPersonAddress.creator_id = context.request.user.personId ? fromGlobalId(context.request.user.personId).id.split(':')[0] : null;
        selectedPersonAddress.expired = activePersonAddress.expired;
      }

      await database('person_address').insert(selectedPersonAddress);
    } else if (!addressId && insertedAddress) {
      await database('person_address')
        .where({ person_id: personId, address_id: insertedAddress })
        .where('expired', '>=', database.raw('CURRENT_TIMESTAMP(6)'))
        .update({ expired: database.raw('CURRENT_TIMESTAMP(6)') });

      await database('person_address').insert({ person_id: personId, address_id: insertedAddress, instructions });
    }
    if (selectedPerson) {
      selectedPerson.first_name = firstName || selectedPerson.first_name;
      selectedPerson.last_name = lastName || selectedPerson.last_name;
      selectedPerson.address_id = insertedAddress || selectedPerson.address_id;
      selectedPerson.created = database.raw('CURRENT_TIMESTAMP(6)');
      selectedPerson.expired = database.raw('CURRENT_TIMESTAMP(6)');

      if (activePerson) {
        await database('person')
          .where({ id: activePerson.id, expired: activePerson.expired })
          .update({ expired: database.raw('CURRENT_TIMESTAMP(6)') });

        selectedPerson.creator_id = context.request.user.personId ? fromGlobalId(context.request.user.personId).id.split(':')[0] : null;
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

export default updatePersonAddressPhone;

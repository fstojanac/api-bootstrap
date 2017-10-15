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

import database from '../../database';
import { toTitleCase, handleMaxPermission } from '../../../utils';
import * as models from '../../models';
import {
  personType,
  personEdge,
  viewerType,
} from '../../types';

export const updatePerson = mutationWithClientMutationId({
  name: 'UpdatePersonMutation',
  inputFields: {
    personId: {
      type: new GraphQLNonNull(GraphQLID),
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
  mutateAndGetPayload: async ({ personId, firstName, lastName, address, city, stateId, zip, latitude, longitude }, context) => {
    handleMaxPermission(context.request.user.accessLevel, 128);
    const personIds = fromGlobalId(personId).id.split(':');
    personId = personIds[0];
    const personExpired = personIds.splice(1).join(':');

    if (stateId) {
      const stateIds = fromGlobalId(stateId).id.split(':');
      stateId = stateIds[0];
    }

    const selectedPerson = await database('person')
      .select('*')
      .where({ id: personId, expired: personExpired })
      .then(res => res[0]);

    const activePerson = await database('person')
      .where({ id: personId })
      .where('expired', '>', database.raw('CURRENT_TIMESTAMP(6)'))
      .then(res => res[0]);

    let insertedAddress = null;
    if (address && city && zip && stateId) {
      insertedAddress = await database('address')
        .select('address.id')
        .where({ address, city, state_id: stateId, zip })
        .then((res) => {
          if (!res[0]) {
            return null;
          }
          return res[0].id;
        });

      if (!insertedAddress) {
        insertedAddress = await database('address').insert({
          creator_id: context.request.user.personId ? fromGlobalId(context.request.user.personId).id.split(':')[0] : null,
          address: toTitleCase(address),
          city: toTitleCase(city),
          state_id: stateId,
          zip,
          latitude,
          longitude,
        }).then(res => res[0]);
      }
    }

    if (selectedPerson) {
      selectedPerson.creator_id = context.request.user.personId ? fromGlobalId(context.request.user.personId).id.split(':')[0] : null;
      selectedPerson.first_name = firstName || selectedPerson.first_name;
      selectedPerson.last_name = lastName || selectedPerson.last_name;
      selectedPerson.address_id = insertedAddress || selectedPerson.address_id;
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

export default updatePerson;

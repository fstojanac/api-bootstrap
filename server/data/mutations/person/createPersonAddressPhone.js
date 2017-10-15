/* eslint-disable no-param-reassign */
import {
  GraphQLNonNull,
  GraphQLID,
  GraphQLString,
  GraphQLFloat,
  GraphQLError,
} from 'graphql';

import {
  mutationWithClientMutationId,
  offsetToCursor,
  toGlobalId,
  fromGlobalId,
} from 'graphql-relay';


import bcrypt from 'bcrypt-nodejs';
import { toTitleCase, handleMaxPermission } from '../../../utils';
import database from '../../database';
import * as models from '../../models';
import {
  personType,
  personEdge,
  viewerType,
} from '../../types';

export const createPersonAddressPhone = mutationWithClientMutationId({
  name: 'CreatePersonAddressPhoneMutation',
  inputFields: {
    firstName: {
      type: new GraphQLNonNull(GraphQLString),
    },
    lastName: {
      type: new GraphQLNonNull(GraphQLString),
    },
    address: {
      type: new GraphQLNonNull(GraphQLString),
    },
    city: {
      type: new GraphQLNonNull(GraphQLString),
    },
    stateId: {
      type: new GraphQLNonNull(GraphQLID),
    },
    zip: {
      type: new GraphQLNonNull(GraphQLString),
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
    email: {
      type: GraphQLString,
    },
    password: {
      type: GraphQLString,
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
  mutateAndGetPayload: async ({ firstName, lastName, address, city, stateId, zip, instructions, latitude, longitude, phone, email, password }, context) => {
    handleMaxPermission(context.request.user.accessLevel, 128);
    const stateIds = fromGlobalId(stateId).id.split(':');
    stateId = stateIds[0];

    let insertedAddress = await database('address')
      .select('address.id')
      .where({ address, city, state_id: stateId, zip })
      .where('address.expired', '>', database.raw('CURRENT_TIMESTAMP(6)'))
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

    const insertedPerson = await database('person').insert({
      creator_id: context.request.user.personId ? fromGlobalId(context.request.user.personId).id.split(':')[0] : null,
      address_id: insertedAddress,
      first_name: firstName,
      last_name: lastName,
    }).then(res => res[0]);

    await database('person_address').insert({
      creator_id: context.request.user.personId ? fromGlobalId(context.request.user.personId).id.split(':')[0] : null,
      person_id: insertedPerson,
      address_id: insertedAddress,
      instructions,
    }).then(res => res[0]);

    if (email && password) {
      const passwordHash = bcrypt.hashSync(password);
      const availableLogin = await database('login')
        .where({ email })
        .where('login.expired', '>', database.raw('CURRENT_TIMESTAMP(6)'))
        .then(res => !res[0]);
      if (availableLogin && passwordHash) {
        await database('login').insert({
          creator_id: context.request.user.personId ? fromGlobalId(context.request.user.personId).id.split(':')[0] : null,
          person_id: insertedPerson,
          access_level: 32,
          email,
          password_hash: passwordHash,
        }).then(res => res[0]);
      } else {
        throw new GraphQLError('Email not available');
      }
    }

    const payload = await database('person')
      .where({ id: insertedPerson })
      .where('expired', '>', database.raw('CURRENT_TIMESTAMP(6)'))
      .then(res => res[0]);

    let id = '';
    id = id.concat(payload.id, ':', payload.expired);

    return { id };
  }
});

export default createPersonAddressPhone;

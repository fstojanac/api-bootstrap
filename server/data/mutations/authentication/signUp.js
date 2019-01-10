/* eslint-disable no-param-reassign */
import {
  GraphQLNonNull,
  GraphQLString,
  GraphQLError,
} from 'graphql';

import {
  mutationWithClientMutationId,
  offsetToCursor,
  toGlobalId,
  fromGlobalId,
} from 'graphql-relay';

import bcrypt from 'bcrypt-nodejs';
import gateway from '../../braintree';
import database from '../../database';
import { handleMaxPermission } from '../../../utils';
import {
  createToken,
} from '../../../utils/authentication';

import * as models from '../../models';
import {
  personType,
  personEdge,
  viewerType,
} from '../../types';

export const signUp = mutationWithClientMutationId({
  name: 'SignUpMutation',
  inputFields: {
    firstName: {
      type: new GraphQLNonNull(GraphQLString),
    },
    lastName: {
      type: new GraphQLNonNull(GraphQLString),
    },
    email: {
      type: new GraphQLNonNull(GraphQLString),
    },
    password: {
      type: new GraphQLNonNull(GraphQLString),
    }
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
  mutateAndGetPayload: async ({ firstName, lastName, email, password }, context) => {
    handleMaxPermission(context.request.user.accessLevel, 128);
    const availableLogin = await database('login')
      .where({ email })
      .where('login.expired', '>', database.raw('CURRENT_TIMESTAMP(6)'))
      .then(res => !res[0]);

    if (!availableLogin) {
      throw new GraphQLError('User information already taken');
    }

    const braintreeCustomer = await gateway.customer.create({
      firstName,
      lastName,
      email,
    }).then(res => res.customer);

    const insertedPerson = await database('person').insert({
      creator_id: context.request.user.personId ? fromGlobalId(context.request.user.personId).id.split(':')[0] : null,
      first_name: firstName,
      last_name: lastName,
      braintree_customer_id: braintreeCustomer.id
    });

    const selectedPerson = await database('person')
      .where({ id: insertedPerson })
      .where('expired', '>', database.raw('CURRENT_TIMESTAMP(6)'))
      .then(res => res[0]);

    const passwordHash = bcrypt.hashSync(password);


    if (availableLogin && passwordHash) {
      await database('login').insert({
        creator_id: context.request.user.personId ? fromGlobalId(context.request.user.personId).id.split(':')[0] : null,
        person_id: selectedPerson.id,
        access_level: 32,
        email,
        password_hash: passwordHash,
      }).then(res => res[0]);
    }

    const token = createToken(context.request, context.response, {
      personId: toGlobalId('Person', `${selectedPerson.id}:${selectedPerson.expired}`),
      braintreeCustomerId: selectedPerson.braintree_customer_id,
      accessLevel: 32,
    });

    const payload = await database('person')
      .where({ id: selectedPerson.id })
      .where('expired', '>', database.raw('CURRENT_TIMESTAMP(6)'))
      .then(res => res[0]);

    let id = '';
    id = id.concat(payload.id, ':', payload.expired);

    return { id, token };
  }
});

export default signUp;

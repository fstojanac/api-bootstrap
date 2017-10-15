/* eslint-disable no-param-reassign */
import {
  GraphQLNonNull,
  GraphQLID,
  GraphQLString,
  GraphQLFloat,
  GraphQLError,
  GraphQLList,
  GraphQLInputObjectType,
} from 'graphql';

import {
  mutationWithClientMutationId,
  offsetToCursor,
  toGlobalId,
  fromGlobalId,
} from 'graphql-relay';

import RandExp from 'randexp';
import bcrypt from 'bcrypt-nodejs';
import { toTitleCase, handleMaxPermission } from '../../../utils';
import database from '../../database';
import * as models from '../../models';
import {
  loginType,
  loginEdge,
  personType,
  personEdge,
  viewerType,
} from '../../types';

export const createEmployee = mutationWithClientMutationId({
  name: 'CreateEmployeeMutation',
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
    longitude: {
      type: GraphQLFloat,
    },
    latitude: {
      type: GraphQLFloat,
    },
    email: {
      type: GraphQLString,
    },
    roles: {
      type: new GraphQLList(new GraphQLInputObjectType({
        name: 'RoleInput',
        fields: {
          roleId: {
            type: new GraphQLNonNull(GraphQLID),
          },
        },
      }))
    },
  },
  outputFields: {
    login: {
      type: loginType,
      resolve: async (payload, args, context, ast) => models.Login.findById(payload.loginId, context, ast)
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
    },
    loginEdge: {
      type: loginEdge,
      resolve: async (payload, args, context, ast) => {
        const totalCount = await database
          .where(models.Login.sqlIDSelect(), '<=', toGlobalId('Login', payload.loginId))
          .from('login')
          .count('* as totalCount')
          .then(res => res[0].totalCount);
        return {
          cursor: offsetToCursor(totalCount),
          node: models.Login.findById(payload.loginId, context, ast),
        };
      }
    }
  },
  mutateAndGetPayload: async ({ firstName, lastName, address, city, stateId, zip, latitude, longitude, email, roles = [] }, context) => {
    handleMaxPermission(context.request.user.accessLevel, 8);
    const availableLogin = await database('login')
      .where({ email })
      .where('login.access_level', '<', 32)
      .where('login.expired', '>', database.raw('CURRENT_TIMESTAMP(6)'))
      .then(res => !res[0]);

    if (!availableLogin) {
      throw new GraphQLError('Email not available');
    } else {
      let insertedLogin = null;
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
      }).then(res => res[0]);

      if (email) {
        const password = new RandExp(/[A-Za-z0-9]\w{8,24}/).gen();
        const passwordHash = bcrypt.hashSync(password);
        let accessLevel = '00000000';
        if (availableLogin && passwordHash) {
          for (const role of roles) { // eslint-disable-line no-restricted-syntax
            const roleIds = fromGlobalId(role.roleId).id.split(':');
            const roleId = roleIds[0];
            let userRole;
            const userRoles = context.request.user.accessLevel.toString(2);
            for (let i = 0; i <= userRoles.length - 1; i++) {
              if (parseInt(userRoles.charAt(userRoles.length - 1 - i), 2)) {
                userRole = 2 ** i;
              }
            }
            if (context.request.user.accessLevel % 2 || userRole < roleId) {
              const rolePosition = Math.log(roleId) / Math.log(2);
              accessLevel = `${accessLevel.substring(0, accessLevel.length - 1 - rolePosition)}1${accessLevel.substring(accessLevel.length - rolePosition)}`;
            }
          }

          await database('login')
            .update({ expired: database.raw('CURRENT_TIMESTAMP(6)') })
            .where('login.email', email)
            .where('login.expired', '>=', database.raw('CURRENT_TIMESTAMP(6)'))
            .then(res => res);

          insertedLogin = await database('login').insert({
            creator_id: context.request.user.personId ? fromGlobalId(context.request.user.personId).id.split(':')[0] : null,
            person_id: insertedPerson,
            access_level: parseInt(accessLevel, 2) === 0 ? 32 : parseInt(accessLevel, 2),
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

      const loginPayload = await database('login')
        .where({ id: insertedLogin })
        .where('expired', '>', database.raw('CURRENT_TIMESTAMP(6)'))
        .then(res => res[0]);

      let id = '';
      id = id.concat(payload.id, ':', payload.expired);
      insertedLogin = ''.concat(loginPayload.id, ':', loginPayload.expired);

      return { id, loginId: insertedLogin };
    }
  }
});

export default createEmployee;

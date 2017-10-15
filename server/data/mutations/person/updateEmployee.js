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

import database from '../../database';
import { toTitleCase, handleMaxPermission } from '../../../utils';
import * as models from '../../models';
import {
  loginType,
  loginEdge,
  personType,
  personEdge,
  viewerType,
} from '../../types';

export const updateEmployee = mutationWithClientMutationId({
  name: 'UpdateEmployeeMutation',
  inputFields: {
    loginId: {
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
    roles: {
      type: new GraphQLList(new GraphQLInputObjectType({
        name: 'RoleUpdate',
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
  mutateAndGetPayload: async ({ loginId, firstName, lastName, address, city, stateId, zip, latitude, longitude, phone, roles = [] }, context) => {
    handleMaxPermission(context.request.user.accessLevel, 8);
    const loginIds = fromGlobalId(loginId).id.split(':');
    loginId = loginIds[0];
    const stateIds = fromGlobalId(stateId).id.split(':');
    stateId = stateIds[0];

    const selectedLogin = await database('login')
      .where('login.id', loginId)
      .where('login.expired', '>', database.raw('CURRENT_TIMESTAMP(6)'))
      .orderBy('login.expired', 'DESC')
      .then(res => res[0]);

    if (!selectedLogin) {
      throw new GraphQLError('Account doesn\'t exists');
    }

    let insertedAddress = null;
    if (address && city && stateId && zip) {
      insertedAddress = await database('address')
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
    }


    if (insertedAddress || firstName || lastName) {
      const selectedPerson = await database('person')
        .where('person.id', selectedLogin.person_id)
        .where('person.expired', '>', database.raw('CURRENT_TIMESTAMP(6)'))
        .then(res => res[0]);

      selectedPerson.creator_id = context.request.user.personId ? fromGlobalId(context.request.user.personId).id.split(':')[0] : null;
      selectedPerson.address_id = insertedAddress || selectedPerson.address_id;
      selectedPerson.first_name = firstName || selectedPerson.first_name;
      selectedPerson.last_name = lastName || selectedPerson.last_name;
      selectedPerson.created = database.raw('CURRENT_TIMESTAMP(6)');

      await database('person')
        .update({ expired: database.raw('CURRENT_TIMESTAMP(6)') })
        .where('person.id', selectedPerson.id)
        .where('person.expired', '>=', database.raw('CURRENT_TIMESTAMP(6)'))
        .then(res => res);

      await database('person').insert(selectedPerson).then(res => res);
    }

    let accessLevel = '00000000';
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

    selectedLogin.creator_id = context.request.user.personId ? fromGlobalId(context.request.user.personId).id.split(':')[0] : null;
    selectedLogin.access_level = parseInt(accessLevel, 2) === 0 ? 32 : parseInt(accessLevel, 2);
    selectedLogin.created = database.raw('CURRENT_TIMESTAMP(6)');

    await database('login')
      .update({ expired: database.raw('CURRENT_TIMESTAMP(6)') })
      .where('login.id', selectedLogin.id)
      .where('login.expired', '>', database.raw('CURRENT_TIMESTAMP(6)'))
      .where('login.reset_password', 1)
      .then(res => res);

    await database('login')
      .update({ expired: database.raw('CURRENT_TIMESTAMP(6)') })
      .where('login.id', selectedLogin.id)
      .where('login.expired', '>', database.raw('CURRENT_TIMESTAMP(6)'))
      .where('login.reset_password', 0)
      .then(res => res);

    await database('login').insert(selectedLogin).then(res => res);

    const payload = await database('person')
      .where({ id: selectedLogin.person_id })
      .where('expired', '>', database.raw('CURRENT_TIMESTAMP(6)'))
      .then(res => res[0]);
    const loginPayload = await database('login')
      .where({ id: selectedLogin.id })
      .where('expired', '>', database.raw('CURRENT_TIMESTAMP(6)'))
      .then(res => res[0]);

    let id = '';
    id = id.concat(payload.id, ':', payload.expired);
    loginId = '';
    loginId = loginId.concat(loginPayload.id, ':', loginPayload.expired);

    return { id, loginId };
  }
});

export default updateEmployee;

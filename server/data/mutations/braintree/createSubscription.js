/* eslint-disable no-param-reassign */
import { GraphQLNonNull, GraphQLString, GraphQLError } from 'graphql';

import {
  mutationWithClientMutationId,

  fromGlobalId
} from 'graphql-relay';

import gateway from '../../braintree';
import database from '../../database';
import { handleMaxPermission } from '../../../utils';

import * as models from '../../models';
import { viewerType } from '../../types';

export const createSubscription = mutationWithClientMutationId({
  name: 'CreateSubscriptionMutation',
  inputFields: {
    planId: {
      type: new GraphQLNonNull(GraphQLString)
    },
    paymentMethodNonce: {
      type: new GraphQLNonNull(GraphQLString)
    },
    discountId: {
      type: GraphQLString
    }
  },
  outputFields: {
    viewer: {
      type: viewerType,
      resolve: (payload, args, context, ast) =>
               models.Viewer.getViewer({ payload, args, context, ast })
    }
  },
  mutateAndGetPayload: async (
           { planId, paymentMethodNonce, discountId },
           context
         ) => {
    handleMaxPermission(context.request.user.accessLevel, 32);
    const personId = fromGlobalId(context.request.user).id.split(':')[0];

    const existingSubscription = await database('subscription')
             .where('subscription.person_id', personId)
             .where('subscription.expired', '>=', database.raw('CURRENT_TIMESTAMP(6)'))
             .then(res => res[0]);

    let subscriptionId;
    if (!existingSubscription) {
      subscriptionId = gateway.subscription.create({
        paymentMethodNonce,
        planId
      })
               .then(res => res.subscription)
              .catch(err => (new GraphQLError(err.message)));
    } else {
      subscriptionId = gateway.subscription.update(existingSubscription.braintree_subscription_id, {
        paymentMethodNonce,
        planId
      })
                   .then(res => res.subscription)
                   .catch(err => (new GraphQLError(err.message)));
    }

    existingSubscription.braintree_subscription_id = subscriptionId;
    existingSubscription.created = database.raw('CURRENT_TIMESTAMP(6)');

    await database('subscription')
             .update({ expired: database.raw('CURRENT_TIMESTAMP(6)') })
             .where('subscription.person_id', personId)
             .where('subscription.expired', '>=', database.raw('CURRENT_TIMESTAMP(6)'))
             .then(res => res);

    await database('subscription').insert(existingSubscription).then(res => res[0]);

    const payload = await database('subscription')
             .where({ person_id: personId })
             .where('expired', '>', database.raw('CURRENT_TIMESTAMP(6)'))
             .then(res => res[0]);

    let id = '';
    id = id.concat(payload.id, ':', payload.expired);

    return { id };
  }
});

export default createSubscription;

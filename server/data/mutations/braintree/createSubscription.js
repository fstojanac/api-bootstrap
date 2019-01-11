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
    },
    cardType: {
      type: new GraphQLNonNull(GraphQLString)
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
           { planId, paymentMethodNonce, discountId, cardType },
           context
         ) => {
    handleMaxPermission(context.request.user.accessLevel, 32);
    const personId = fromGlobalId(context.request.user.personId).id.split(':')[0];
    const plans = await gateway.plan.all().then(res => res.plans);
    const plan = plans.find(pl => pl.id === planId);

    const discount = await database('discount')
    .where('discount.code', discountId)
    .where('discount.expired', '>=', database.raw('CURRENT_TIMESTAMP(6)'))
    .then(res => res[0]);

    let discountAmount = 0;
    if (discount && (!discount.card_type || discount.card_type === cardType)) {
      if (discount.amount) {
        discountAmount += discount.amount;
      }

      if (discount.percentage) {
        discountAmount += (plan.price * discount.percentage).toFixed(2);
      }
    }

    const existingSubscription = await database('subscription')
             .where('subscription.person_id', personId)
             .where('subscription.expired', '>=', database.raw('CURRENT_TIMESTAMP(6)'))
             .then(res => res[0]);

    if (!existingSubscription) {
      const subscriptionId = await gateway.subscription.create({
        paymentMethodNonce,
        planId,
        discounts: {
          add: [{
            inheritedFromId: 'kf9r', amount: discountAmount, numberOfBillingCycles: (discount && discount.number_of_cycles) ? discount.number_of_cycles : undefined
          }]
        }
      }).then((res) => {
        if (!res.success) {
          return false;
        }
        return res.subscription.id;
      }).catch(err => (new GraphQLError(err.message)));
      if (!subscriptionId) {
        throw new GraphQLError('Payment failed');
      }
      await database('subscription').insert({ person_id: personId, braintree_subscription_id: subscriptionId }).then(res => res[0]);
    } else {
      const subscriptionId = await gateway.subscription.update(existingSubscription.braintree_subscription_id, {
        paymentMethodNonce,
        planId,
        price: plan.price,
        discounts: {
          add: [{
            inheritedFromId: 'kf9r', amount: discountAmount, numberOfBillingCycles: (discount && discount.number_of_cycles) ? discount.number_of_cycles : undefined
          }]
        },
        options: {
          prorateCharges: true,
          replaceAllAddOnsAndDiscounts: true
        }
      }).then((res) => {
        if (!res.success) {
          return false;
        }
        return res.subscription.id;
      }).catch(err => (new GraphQLError(err.message)));
      if (!subscriptionId) {
        throw new GraphQLError('Payment failed');
      }
      existingSubscription.braintree_subscription_id = subscriptionId;
      existingSubscription.created = database.raw('CURRENT_TIMESTAMP(6)');

      await database('subscription')
             .update({ expired: database.raw('CURRENT_TIMESTAMP(6)') })
             .where('subscription.person_id', personId)
             .where('subscription.expired', '>=', database.raw('CURRENT_TIMESTAMP(6)'))
             .then(res => res);

      await database('subscription').insert(existingSubscription).then(res => res[0]);
    }


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

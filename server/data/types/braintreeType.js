import { GraphQLObjectType, GraphQLList, GraphQLID, GraphQLString } from 'graphql';
import {
  fromGlobalId,
} from 'graphql-relay';
import GraphQLJSON from 'graphql-type-json';
import gateway from '../braintree';
import config from '../../config/environment';
import database from '../database';

export const braintreeType = new GraphQLObjectType({
  name: 'Braintree',
  description: '',
  fields: () => ({
    id: {
      type: GraphQLID,
      resolve: () => config.braintree.merchantId
    },
    plans: {
      type: new GraphQLList(GraphQLJSON),
      resolve: () => gateway.plan.all().then(res => res.plans)
    },
    clientToken: {
      type: GraphQLString,
      resolve: (payload, args, context) => context.request.user.braintreeCustomerId &&
               gateway.clientToken.generate({ customerId: context.request.user.braintreeCustomerId }).then(res => res.clientToken)
    },
    braintreeCustomer: {
      type: GraphQLJSON,
      resolve: (payload, args, context) => context.request.user.braintreeCustomerId && gateway.customer.find(
            context.request.user.braintreeCustomerId
               )
    },
    braintreeCustomerSubscription: {
      type: GraphQLJSON,
      resolve: async (payload, args, context) => {
        if (!context.request.user.personId) {
          return null;
        }
        const personId = fromGlobalId(context.request.user.personId).id.split(':')[0];
        const subscription = await database('subscription')
        .where('subscription.person_id', personId)
        .where('subscription.expired', '>=', database.raw('CURRENT_TIMESTAMP(6)'))
        .then(res => res[0]);

        if (!subscription) {
          return null;
        }

        return await gateway.subscription.find(subscription.braintree_subscription_id);
      }
    }
  })
});

export const queryBraintree = {
  type: braintreeType,
  resolve: () => ({})
};

export default braintreeType;

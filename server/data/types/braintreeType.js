import { GraphQLObjectType, GraphQLList, GraphQLID, GraphQLString } from 'graphql';

import GraphQLJSON from 'graphql-type-json';
import gateway from '../braintree';
import config from '../../config/environment';

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
    }
  })
});

export const queryBraintree = {
  type: braintreeType,
  resolve: () => ({})
};

export default braintreeType;

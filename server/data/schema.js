/* eslint-disable no-unused-vars, no-use-before-define */
import {
  GraphQLSchema,
  GraphQLObjectType,
} from 'graphql';

import { nodeField } from './defaultDefinitions';

import { Viewer } from './models';
import { viewerType } from './types/index';
import * as mutations from './mutations/index';


/**
 * This is the type that will be the root of our query,
 * and the entry point into our schema.
 */
const queryType = new GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    node: nodeField,
    viewer: {
      type: viewerType,
      resolve: (source, args, context, info) => Viewer.getViewer({ source, args, context, info })
    }
  })
});

/**
 * This is the type that will be the root of our mutations,
 * and the entry point into performing writes in our schema.
 */
const mutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: () => ({
    ...mutations,
  })
});

/**
 * Finally, we construct our schema (whose starting query type is the query
 * type we defined above) and export it.
 */
export default new GraphQLSchema({
  query: queryType,
  mutation: mutationType,
});

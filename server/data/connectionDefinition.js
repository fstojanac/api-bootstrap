import {
  GraphQLInt,
  GraphQLError,
  GraphQLNonNull,
} from 'graphql';
import {
  cursorToOffset,
  connectionFromArraySlice,
} from 'graphql-relay';
import GraphQLJSON from 'graphql-type-json';
import {
  treeizeInstance,
} from './models/BaseModel';

export const totalCountType = {
  totalCount: {
    type: new GraphQLNonNull(GraphQLInt),
    description: `A count of the total number of objects in this connection, ignoring pagination. 
    This allows a client to fetch the first five objects by passing "5" as the argument to "first", 
    then fetch the total count so it could display "5 of 83", for example.`,
  },
  availableFilters: {
    type: GraphQLJSON,
  },
  availableSorts: {
    type: GraphQLJSON,
  },
};

export const connectionWithCountDefinition = async (connectionObject, args, context, info) => { // eslint-disable-line no-unused-vars
  if (args.after && args.before) {
    throw new GraphQLError('Arguments "after" and "before" cannot be used at the same time');
  }
  if (args.first && args.last) {
    throw new GraphQLError('Arguments "first" and "last" cannot be used at the same time');
  }
  if (args.after && (args.last || !args.first)) {
    throw new GraphQLError('Argument "after" can only be used along with argument "first"');
  }
  if (args.before && (args.first || !args.last)) {
    throw new GraphQLError('Argument "before" can only be used along with argument "last"');
  }

  const totalCount = await connectionObject ? await connectionObject.countQuery.count('* as totalCount').then(res => res[0].totalCount) : 0;

  let offset = 0;
  const limit = args.first || args.last || 1000;

  if (args.after) {
    offset = cursorToOffset(args.after) + 1;
  } else if (args.before) {
    offset = Math.max(cursorToOffset(args.before) - limit, 0);
  } else if (args.last) {
    offset = Math.max(totalCount - limit, 0);
  }

  const queryResult = await connectionObject ? await connectionObject.dataQuery(limit, offset) : [];
  const connectionArray = totalCount ? treeizeInstance(queryResult || [], connectionObject.sqlAST, context) : [];

  return {
    totalCount: queryResult !== null ? totalCount : 0,
    availableFilters: await connectionObject ? await connectionObject.availableFilters : {},
    availableSorts: await connectionObject ? await connectionObject.availableSorts : {},
    ...connectionFromArraySlice(connectionArray, args, {
      sliceStart: offset,
      arrayLength: totalCount,
    })
  };
};

import {
  GraphQLList,
  GraphQLEnumType,
  GraphQLInputObjectType,
} from 'graphql';

export const SortType = new GraphQLEnumType({
  name: 'Sort',
  description: 'The direction in which to sort the nodes in a connection.',
  values: {
    ASC: {
      value: 'asc'
    },
    DESC: {
      value: 'desc'
    }
  }
});

export const SortRegistry = new Map();

function traverseType(fields, filterObject = {}) {
  let filterName = null;

  Object.keys(fields).forEach((field) => {
    if (fields[field].join !== 'one-to-many') {
      if (fields[field].join === 'one-to-one') {
        filterName = `${fields[field].type.name}Sort`;

        if (SortRegistry.get(filterName)) {
          Object.assign(filterObject, {
            [field]: SortRegistry.get(filterName).sort
          });
        }
      } else {
        Object.assign(filterObject, {
          [field]: {
            type: SortType
          }
        });
      }
    }
  });

  return filterObject;
}

export function generateSortArgs(graphQlType, additionalSorts = {}) {
  const sortName = `${graphQlType.name}Sort`;

  if (!SortRegistry.has(sortName)) {
    SortRegistry.set(sortName, {
      sort: {
        type: new GraphQLList(new GraphQLInputObjectType({
          name: sortName,
          fields: () => ({
            ...traverseType(graphQlType._typeConfig.fields()), // eslint-disable-line no-underscore-dangle
            ...additionalSorts,
          })
        }))
      }
    });
  }

  return SortRegistry.get(sortName);
}

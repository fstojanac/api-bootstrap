import {
  getNamedType,
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLString,
  GraphQLScalarType,
} from 'graphql';

export const FilterRegistry = new Map();
export const filterPrefix = '__';

export const filterOperators = {
  [`${filterPrefix}eq`]: '=',
  [`${filterPrefix}neq`]: '!=',
  [`${filterPrefix}in`]: 'in',
  [`${filterPrefix}nin`]: 'not in',
  [`${filterPrefix}gt`]: '>',
  [`${filterPrefix}gte`]: '>=',
  [`${filterPrefix}lt`]: '<',
  [`${filterPrefix}lte`]: '<=',
  [`${filterPrefix}li`]: 'like',
  [`${filterPrefix}nli`]: 'not like'
};

export function defineFilter(options, name) {
  const { type, allow } = options;
  const fields = {};

  allow.forEach((field) => {
    if (field === 'in' || field === 'nin') {
      fields[filterPrefix + field] = {
        type: new GraphQLList(type)
      };
    } else if (field === 'null') {
      fields[`${filterPrefix}null`] = {
        type: GraphQLBoolean
      };
    } else {
      fields[filterPrefix + field] = {
        type
      };
    }
  });

  return new GraphQLInputObjectType({
    name: `${name || type.name}Filter`,
    fields
  });
}

export const BooleanFilterType = defineFilter({
  type: GraphQLBoolean,
  allow: ['eq', 'null']
});

export const FloatFilterType = defineFilter({
  type: GraphQLFloat,
  allow: ['eq', 'neq', 'in', 'nin', 'gt', 'gte', 'lt', 'lte', 'null']
});

export const IDFilterType = defineFilter({
  type: GraphQLID,
  allow: ['eq', 'neq', 'in', 'nin', 'null']
});

export const IntFilterType = defineFilter({
  type: GraphQLInt,
  allow: ['eq', 'neq', 'in', 'nin', 'gt', 'gte', 'lt', 'lte', 'null']
});

export const StringFilterType = defineFilter({
  type: GraphQLString,
  allow: ['eq', 'neq', 'in', 'nin', 'li', 'nli', 'null']
});

export const RangeFilter = defineFilter({
  type: GraphQLFloat,
  allow: ['eq']
}, 'Range');

export const CustomFilterType = defineFilter({
  type: new GraphQLScalarType({
    name: 'Custom',
    serialize: String,
    parseValue: String,
    parseLiteral: ast => ast.value
  }),
  allow: ['eq']
});

export function filterType(type) {
  if (!type) {
    return CustomFilterType;
  }

  switch (getNamedType(type).name) {
    case 'Boolean':
      return BooleanFilterType;
    case 'Float':
      return FloatFilterType;
    case 'ID':
      return IDFilterType;
    case 'Int':
      return IntFilterType;
    case 'String':
      return StringFilterType;
    default:
      return CustomFilterType;
  }
}

export function traverseType(fields, filterObject = {}) {
  let filterName = null;

  Object.keys(fields).forEach((field) => {
    if (fields[field].join !== 'one-to-many' && !fields[field].filterIgnore) {
      if (fields[field].join === 'one-to-one') {
        filterName = `${fields[field].type.name}Filter`;

        if (FilterRegistry.get(filterName)) {
          Object.assign(filterObject, {
            [field]: FilterRegistry.get(filterName).filter
          });
        }
      } else {
        Object.assign(filterObject, {
          [field]: {
            type: filterType(fields[field].type)
          }
        });
      }
    }
  });

  return filterObject;
}

export function generateFilterArgs(graphQlType, additionalFilters = {}) {
  const filterName = `${graphQlType.name}Filter`;

  if (!FilterRegistry.has(filterName)) {
    FilterRegistry.set(filterName, {
      filter: {
        type: new GraphQLList(new GraphQLInputObjectType({
          name: filterName,
          fields: () => ({
            ...traverseType(graphQlType._typeConfig.fields()), // eslint-disable-line no-underscore-dangle
            ...additionalFilters,
          })
        }))
      }
    });
  }

  return FilterRegistry.get(filterName);
}

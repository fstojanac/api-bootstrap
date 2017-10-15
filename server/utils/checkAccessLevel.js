import {
  GraphQLError
} from 'graphql';

export const handleMaxPermission = (userAccessLevel, requiredPermission) => {
  const userRoles = userAccessLevel.toString(2);
  for (let i = 0; i < userRoles.length; i++) {
    if (parseInt(userRoles.charAt(userRoles.length - 1 - i), 10)) {
      if (2 ** i > requiredPermission) {
        throw new GraphQLError('You don\'t have needed permissions to perform this action.');
      }
      return;
    }
  }
};

export default {
  handleMaxPermission
};

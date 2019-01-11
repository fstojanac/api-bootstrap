import React from 'react';
import { Query } from 'react-apollo';
import { Redirect } from 'react-router-dom';

import * as routes from '../../constants/routes';
import { GET_ME } from './queries';

const withAuthorization = conditionFn => Component => props => (
  <Query query={GET_ME}>
    {({ data }) => {
      console.log(data, conditionFn(data));
      return conditionFn(data) ? (
        <Component {...props} />
      ) : (
        <Redirect to={routes.SIGN_IN} />
      );
    }}
  </Query>
);

export default withAuthorization;

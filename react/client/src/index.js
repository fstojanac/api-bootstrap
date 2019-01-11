import React from 'react';
import ReactDOM from 'react-dom';
import { ApolloProvider } from 'react-apollo';
import { ApolloClient } from 'apollo-client';
import { ApolloLink } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';

import App from './components/App';
import registerServiceWorker from './registerServiceWorker';

const httpLink = new HttpLink({
  uri: 'http://localhost:8085',
  credentials: 'include',
});

const authLink = new ApolloLink((operation, forward) => {
  operation.setContext(
    ({
      headers = {},
      localToken = localStorage.getItem('token'),
    }) => {
      if (localToken) {
        headers.Authorization = `Bearer ${localToken}`;
      }
      return {
        headers,
      };
    },
  );

  return forward(operation);
});

const link = ApolloLink.from([httpLink, authLink]);

const cache = new InMemoryCache();

const client = new ApolloClient({
  link,
  cache
});

ReactDOM.render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>,
  document.getElementById('root'),
);

registerServiceWorker();

import gql from 'graphql-tag';

export const GET_ME = gql`
         {
           viewer {
             id
             personId
             accessLevel
           }
         }
       `;

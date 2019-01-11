import React from 'react';
import { Query } from 'react-apollo';
import gql from 'graphql-tag'; import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';

const CUSTOMER = gql`
  query {
    viewer {
      id
      braintree {
        id
        plans
        braintreeCustomerSubscription
      }
    }
  }
`;

const styles = {
  root: {
    width: '100%',
    overflowX: 'auto',
  },
  table: {
    minWidth: 700,
  },
};

function ActivePlan(props) {
  const { classes } = props;

  return (
    <Query query={CUSTOMER}>
      {({ loading, error, data }) => {
        if (loading) return 'Loading...';
        if (error) return `Error! ${error.message}`;
        const subscription = data.viewer.braintree.braintreeCustomerSubscription;
        return (
          <Paper className={classes.root}>
            <Table className={classes.table}>
              <TableHead>
                <TableRow>
                  <TableCell align="right">First billing date</TableCell>
                  <TableCell align="right">Next billing date</TableCell>
                  <TableCell align="right">Positive balance</TableCell>
                  <TableCell align="right">Next bill amount</TableCell>
                  <TableCell align="right">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subscription && (
                      <TableRow key={subscription.id}>
                      <TableCell align="right">{subscription.firstBillingDate}</TableCell>
                      <TableCell align="right">{subscription.nextBillingDate}</TableCell>
                      <TableCell align="right">{-subscription.balance} EUR</TableCell>
                      <TableCell align="right">{subscription.nextBillAmount} EUR</TableCell>
                      <TableCell align="right">{subscription.status}</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        );
      }}
    </Query>
  );
}

ActivePlan.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(ActivePlan);

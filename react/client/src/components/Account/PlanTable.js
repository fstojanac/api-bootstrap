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

const PLANS = gql`
  query {
    viewer {
      id
      braintree {
        id
        plans
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

function PlanTable(props) {
  const { classes } = props;

  return (
    <Query query={PLANS}>
      {({ loading, error, data }) => {
        if (loading) return 'Loading...';
        if (error) return `Error! ${error.message}`;

        return (
          <Paper className={classes.root}>
            <Table className={classes.table}>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell align="right">Price</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.viewer.braintree.plans.map(n => (
                    <TableRow key={n.id}>
                      <TableCell component="th" scope="row">
                        {n.name}
                      </TableCell>
                      <TableCell align="right">{n.price} EUR</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Paper>
        );
      }}
    </Query>
  );
}

PlanTable.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(PlanTable);

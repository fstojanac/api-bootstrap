import React from 'react';
import PropTypes from 'prop-types';
import braintreeWebDropin from 'braintree-web-drop-in';
import BraintreeDropin from 'braintree-dropin-react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import withStyles from '@material-ui/core/styles/withStyles';
import CssBaseline from '@material-ui/core/CssBaseline';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import FormControl from '@material-ui/core/FormControl';
import Typography from '@material-ui/core/Typography';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';

const SUBSCRIBE = gql`
  mutation($paymentMethodNonce: String!, $planId: String!, $discountId: String, $cardType: String!) {
    createSubscription(input: {paymentMethodNonce: $paymentMethodNonce, planId: $planId, discountId: $discountId, cardType: $cardType}) {
    viewer {
      id
      braintree {
        id
        braintreeCustomer
        braintreeCustomerSubscription
      }
    }
  }
  }
`;

const styles = theme => ({
  appBar: {
    position: 'relative',
  },
  layout: {
    width: 'auto',
    marginLeft: theme.spacing.unit * 2,
    marginRight: theme.spacing.unit * 2,
    [theme.breakpoints.up(600 + theme.spacing.unit * 2 * 2)]: {
      width: 600,
      marginLeft: 'auto',
      marginRight: 'auto',
    },
  },
  paper: {
    marginTop: theme.spacing.unit * 3,
    marginBottom: theme.spacing.unit * 3,
    padding: theme.spacing.unit * 2,
    [theme.breakpoints.up(600 + theme.spacing.unit * 3 * 2)]: {
      marginTop: theme.spacing.unit * 6,
      marginBottom: theme.spacing.unit * 6,
      padding: theme.spacing.unit * 3,
    },
  },
  stepper: {
    padding: `${theme.spacing.unit * 3}px 0 ${theme.spacing.unit * 5}px`,
  },
  buttons: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  button: {
    marginTop: theme.spacing.unit * 3,
    marginLeft: theme.spacing.unit,
  },
});


const INITIAL_STATE = {
  paymentMethodNonce: null,
  planId: '',
  discountId: '',
  cardType: '',
  loading: false
};

class ChangePlan extends React.Component {
  state = {
    ...INITIAL_STATE
  };

  renderSubmitButton = ({ onClick, isDisabled }) => {
    const { planId, paymentMethodNonce, discountId, cardType, loading } = this.state;
    return (
            <Mutation mutation={SUBSCRIBE} variables={{ planId, paymentMethodNonce, discountId, cardType }}>
        {createSubscription =>
      <Button
      type="submit"
      fullWidth
      variant="contained"
      color="primary"
     onClick={() => this.onSubmit(onClick, createSubscription)}
      disabled={isDisabled || !planId || loading}
      >
                  Subscribe
                </Button>
                       }
      </Mutation>
    );
  };

  handleChange = (event) => {
    this.setState({ planId: event.target.value });
  };

  onChange = (event) => {
    const { name, value } = event.target;
    this.setState({ [name]: value });
  };

  handleTextInput = name => (event) => {
    this.setState({
      [name]: event.target.value,
    });
  };

  handlePaymentMethod = (payload) => {
    this.setState({ paymentMethodNonce: payload.nonce, cardType: payload.details.cardType });
  }

  onCreate = (instance) => {
    console.log('onCreate', instance);
  }

  onDestroyStart = () => {
    console.log('onDestroyStart');
  }

  onDestroyEnd = () => {
    console.log('onDestroyEnd');
  }

  onError = (error) => {
    console.log('onError', error);
  }

  onSubmit = async (event, createSubscription) => {
    this.setState({ loading: true });
    event();


    const createSub = () => createSubscription().then(async () => {
      this.setState({ ...INITIAL_STATE });
    }).catch(async () => this.setState({ ...INITIAL_STATE }));

    setTimeout(() => {
      createSub();
    }, 200);
  };

  render() {
    const { classes, braintree } = this.props;
    const { planId, discountId } = this.state;

    return (

      <React.Fragment>
        <CssBaseline />
        <main className={classes.layout}>
          <Paper className={classes.paper}>
            <Typography component="h1" variant="h4" align="center">
              Checkout
            </Typography>
            <Typography variant="h6" gutterBottom>
              Select Plan
      </Typography>
                    <form className={classes.form}>
                <FormControl margin="normal" fullWidth>
            <Select
              value={planId}
              onChange={this.handleChange}
              autoWidth={true}
              inputProps={{
                name: 'planId',
                id: 'planId',
              }}
            >
{braintree.plans.map(plan =>
  (
                      <MenuItem key={plan.id} value={plan.id}>{plan.name}</MenuItem>
))}
            </Select>
            </FormControl>
                <FormControl margin="normal" fullWidth>
                  <InputLabel htmlFor="discountId">
                    Discount code
                  </InputLabel>
                  <Input id="discountId" name="discountId" value={discountId} onChange={this.onChange} />
                </FormControl>
                                <FormControl margin="normal" fullWidth>

            <BraintreeDropin
          braintree={braintreeWebDropin}
          options={{
            locale: 'en_US',
            vaultManager: true,
            authorization: braintree.clientToken
          }}
          authorizationToken={braintree.clientToken}
          handlePaymentMethod={this.handlePaymentMethod}
          onCreate={this.onCreate}
          onDestroyStart={this.onDestroyStart}
          onDestroyEnd={this.onDestroyEnd}
          onError={this.onError}
          submitButtonText="Subscribe"
          renderSubmitButton={this.renderSubmitButton}
        />
        </FormControl>
        </form>
          </Paper>
        </main>
      </React.Fragment>
    );
  }
}

ChangePlan.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(ChangePlan);

import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import LockIcon from '@material-ui/icons/LockOutlined';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import withStyles from '@material-ui/core/styles/withStyles';

import * as routes from '../../constants/routes';
import ErrorMessage from '../Error';

const SIGN_IN = gql`
  mutation($email: String!, $password: String!) {
    login(input: {email: $email, password: $password}) {
      viewer{
        id
        personId
        accessLevel
        token
      }
    }
  }
`;

const styles = theme => ({
  main: {
    width: 'auto',
    display: 'block', // Fix IE 11 issue.
    marginLeft: theme.spacing.unit * 3,
    marginRight: theme.spacing.unit * 3,
    [theme.breakpoints.up(400 + theme.spacing.unit * 3 * 2)]: {
      width: 400,
      marginLeft: 'auto',
      marginRight: 'auto',
    },
  },
  paper: {
    marginTop: theme.spacing.unit * 8,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: `${theme.spacing.unit * 2}px ${theme.spacing.unit *
      3}px ${theme.spacing.unit * 3}px`,
  },
  avatar: {
    margin: theme.spacing.unit,
    backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing.unit,
  },
  submit: {
    marginTop: theme.spacing.unit * 3,
  },
});

const SignInPage = ({ history, refetch, classes }) => (
  <div>
    <SignInForm history={history} refetch={refetch} classes={classes} />
  </div>
);

const INITIAL_STATE = {
  email: '',
  password: '',
  open: false
};

class SignInForm extends Component {

  state = { ...INITIAL_STATE };

  onChange = (event) => {
    const { name, value } = event.target;
    this.setState({ [name]: value });
  };

  onSubmit = (event, login) => {
    login().then(async ({ data }) => {
      this.setState({ ...INITIAL_STATE });
      localStorage.setItem('token', data.login.viewer.token);

      await this.props.refetch();

      this.props.history.push(routes.ACCOUNT);
    });

    event.preventDefault();
  };

  render() {
    const { email, password } = this.state;
    const { classes } = this.props;

    const isInvalid = password === '' || email === '';

    return <Mutation mutation={SIGN_IN} variables={{ email, password }}>
        {(login, { loading, error }) =>
          <main className={classes.main}>
            <CssBaseline />
            <Paper className={classes.paper}>
              <Avatar className={classes.avatar}>
                <LockIcon />
              </Avatar>
              <Typography component="h1" variant="h5">
                Sign in
              </Typography>
              <form className={classes.form} onSubmit={event => this.onSubmit(event, login)}>
                <FormControl margin="normal" required fullWidth>
                  <InputLabel htmlFor="email">
                    Email Address
                  </InputLabel>
                  <Input id="email" name="email" value={email} onChange={this.onChange} autoComplete="email" autoFocus />
                </FormControl>
                <FormControl margin="normal" required fullWidth>
                  <InputLabel htmlFor="password">
                    Password
                  </InputLabel>
                  <Input name="password" type="password" value={password} onChange={this.onChange} id="password" autoComplete="current-password" />
                </FormControl>
                <Button type="submit" fullWidth disabled={isInvalid || loading} variant="contained" color="primary" className={classes.submit}>
                  Sign in
                </Button>
                {error && <ErrorMessage error={error} />}
              </form>
            </Paper>
          </main>}
      </Mutation>;
  }
}


export default withRouter(withStyles(styles)(SignInPage));

export { SignInForm };

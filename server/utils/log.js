console.log('required logger'); // eslint-disable-line no-console

global.log = (message) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(message); // eslint-disable-line no-console
  }
};

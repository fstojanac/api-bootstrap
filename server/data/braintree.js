import braintree from 'braintree';
import config from '../config/environment';

const gateway = braintree.connect({
  environment: braintree.Environment.Sandbox,
  merchantId: config.braintree.merchantId,
  publicKey: config.braintree.publicKey,
  privateKey: config.braintree.privateKey
});

export default gateway;

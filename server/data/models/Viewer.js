import { viewerType } from '../types';

class Viewer {

  constructor({ type }) {
    this.type = type;
  }

  get graphQLType() {
    return this.type;
  }


  // refator this into somethig like getViewer
  // since all mutations and nodeDefinition use models.Viewer.findById(1) to get viewer
  // se if id can also be dynamic since it doesnt not efect viewer resolveing but could efect
  // relay interl but that may be ok since that would invalidate old viewer properties
  getViewer = ({ context }) => (
    Object.assign({}, {
      id: 1, // hardcoded for viewer
      token: context.request.session.token,
      personId: context.request.user.personId,
      accessLevel: context.request.user.accessLevel,
      ip: context.request.ip || (context.request.connection || {}).remoteAddress
    })
  );

}

export default new Viewer({ type: viewerType });

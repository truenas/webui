import 'rxjs/add/operator/map';

import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {Observable, Subject, Subscription} from 'rxjs/Rx';

import {EntityUtils} from '../pages/common/entity/utils'
import {RestService, WebSocketService} from '../services/';

@Injectable()
export class IscsiService {
  protected iscsiPortalResource: string = 'services/iscsi/portal';
  protected iscsiInitiatorResource: string =
      'services/iscsi/authorizedinitiator';
  protected iscsiAuthCredentialResource: string =
      'services/iscsi/authcredential';

  constructor(protected rest: RestService, protected ws: WebSocketService) {};

  getIpChoices() {
    return this.ws.call('notifier.choices', [ 'IPChoices', [ true, false ] ]);
  };

  listPortals() { return this.rest.get(this.iscsiPortalResource, {}); };

  listInitiators() { return this.rest.get(this.iscsiInitiatorResource, {}); };

  listAuthCredential() {
    return this.rest.get(this.iscsiAuthCredentialResource, {});
  };
}

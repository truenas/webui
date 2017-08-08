import 'rxjs/add/operator/map';

import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {Observable, Subject, Subscription} from 'rxjs/Rx';

import {EntityUtils} from '../pages/common/entity/utils'
import {RestService, WebSocketService} from '../services/';

@Injectable()
export class IscsiService {
  protected iscsiPortalResource: string = 'services/iscsi/portal';
  protected iscsiInitiatorResource: string = 'services/iscsi/authorizedinitiator';
  protected iscsiAuthCredentialResource: string = 'services/iscsi/authcredential';
  protected iscsiTargetGroupsResource: string = 'services/iscsi/targetgroup';
  protected volumeResource: string = 'storage/volume';
  protected iscsiExtentResource: string = 'services/iscsi/extent/';
  protected iscsiTargetResource: string = 'services/iscsi/target/';

  constructor(protected rest: RestService, protected ws: WebSocketService) {};

  getIpChoices() {
    return this.ws.call('notifier.choices', [ 'IPChoices', [ true, false ] ]);
  };

  listPortals() { return this.rest.get(this.iscsiPortalResource, {}); };

  listInitiators() { return this.rest.get(this.iscsiInitiatorResource, {}); };

  listAuthCredential() {
    return this.rest.get(this.iscsiAuthCredentialResource, {});
  };

  listTargetGroups() { return this.rest.get(this.iscsiTargetGroupsResource, {}); };

  getRPMChoices() {
    return this.ws.call('notifier.choices', ['EXTENT_RPM_CHOICES', [true, false]]);
  };

  getVolumes() {
    return this.rest.get(this.volumeResource, {});
  };

  getZvols(volume) {
    let rs = this.volumeResource + '/' + volume + '/zvols';
    return this.rest.get(rs, {});
  }

  getExtents() {
    return this.rest.get(this.iscsiExtentResource, {});
  }

  getTargets() {
    return this.rest.get(this.iscsiTargetResource, {});
  }
}

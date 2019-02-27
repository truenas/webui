import 'rxjs/add/operator/map';

import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {Observable, Subject, Subscription} from 'rxjs/Rx';

import {EntityUtils} from '../pages/common/entity/utils'
import {RestService} from './rest.service';
import {WebSocketService} from './ws.service';

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
    return this.ws.call('notifier.choices', [ 'IPChoices', [ true, true ] ]);
  };

  listPortals() { return this.rest.get(this.iscsiPortalResource, {limit: 0}); };

  listInitiators() { return this.rest.get(this.iscsiInitiatorResource, {limit: 0}); };

  listAuthCredential() {
    return this.rest.get(this.iscsiAuthCredentialResource, {limit: 0});
  };

  listTargetGroups() { return this.rest.get(this.iscsiTargetGroupsResource, {limit: 0}); };

  getRPMChoices() {
    return this.ws.call('notifier.choices', ['EXTENT_RPM_CHOICES', [true, false]]);
  };

  getVolumes() {
    return this.rest.get(this.volumeResource, {limit: 0});
  };

  getExtentDevices() {
    return this.ws.call('iscsi.extent.disk_choices',[]);
  };

  getExtents() {
    return this.rest.get(this.iscsiExtentResource, {limit: 0});
  }

  getTargets() {
    return this.rest.get(this.iscsiTargetResource, {limit: 0});
  }

  getAuth() {
    return this.ws.call('iscsi.auth.query', []);
  }
}

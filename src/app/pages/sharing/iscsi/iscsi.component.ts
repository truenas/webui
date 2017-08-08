import {Component} from '@angular/core';
import {Router} from '@angular/router';

import {
  GlobalconfigurationComponent
} from './globalconfiguration/globalconfiguration.component';

@Component({
  selector : 'iscsi',
  template : `
    <md-card>
      <md-tab-group>
        <md-tab label="Global Configuration">
          <app-iscsi-globalconfiguration></app-iscsi-globalconfiguration>
        </md-tab>
        <md-tab label="Portals">
          <app-iscsi-portal-list></app-iscsi-portal-list>
        </md-tab>
        <md-tab label="Initiators">
          <app-iscsi-initiator-list></app-iscsi-initiator-list>
        </md-tab>
        <md-tab label="Authorized Access">
          <app-iscsi-authorizedaccess-list></app-iscsi-authorizedaccess-list>
        </md-tab>
        <md-tab label="Targets">
          <app-iscsi-target-list></app-iscsi-target-list>
        </md-tab>
        <md-tab label="Extents">
          <app-iscsi-extent-list></app-iscsi-extent-list>
        </md-tab>
        <md-tab label="Associated Targets">
          <app-iscsi-associated-target-list></app-iscsi-associated-target-list>
        </md-tab>
      </md-tab-group>
    </md-card>
  `,
})
export class ISCSI {

  constructor(
      protected router: Router,
  ) {}

  ngOnInit() {}
}

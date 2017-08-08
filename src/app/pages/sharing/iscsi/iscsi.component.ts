import {Component} from '@angular/core';
import {Router} from '@angular/router';

import {
  GlobalconfigurationComponent
} from './globalconfiguration/globalconfiguration.component';

@Component({
  selector : 'iscsi',
  template : `
    <div layout='flex-xs'>
    <h2>Global Configuration</h2>
    <app-iscsi-globalconfiguration></app-iscsi-globalconfiguration>
    
    <h2>Portals</h2>
    <app-iscsi-portal-list></app-iscsi-portal-list>

    <h2>Initiators</h2>
    <app-iscsi-initiator-list></app-iscsi-initiator-list>

    <h2>Authorized Access</h2>
    <app-iscsi-authorizedaccess-list></app-iscsi-authorizedaccess-list>

    <h2>Targets</h2>
    <app-iscsi-target-list></app-iscsi-target-list>

    <h2>Extents</h2>
    <app-iscsi-extent-list></app-iscsi-extent-list>
    </div>
    `
})
export class ISCSI {

  constructor(
      protected router: Router,
  ) {}

  ngOnInit() {}
}

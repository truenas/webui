import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { IscsiNavComponent } from './navbar/navbar.component';

@Component({
  selector: 'iscsi',
  template: `
    <h2>Global Configuration</h2>
    <app-iscsi-globalconfiguration></app-iscsi-globalconfiguration>
    
    <h2>Portals</h2>
    <app-iscsi-portal-list></app-iscsi-portal-list>

    <h2>Initiators</h2>
    <app-iscsi-initiator-list></app-iscsi-initiator-list>
    `
})
export class ISCSI {

  constructor(protected router: Router,) {
  }

  ngOnInit() {
    
  }

}

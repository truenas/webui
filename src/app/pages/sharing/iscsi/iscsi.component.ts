import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import * as _ from 'lodash';

@Component({
  selector : 'iscsi',
  template : `
    <md-card>
      <md-tab-group #tabGroup (selectChange)="onSelectChange($event)">
        <md-tab label="Global Configuration">
          <app-iscsi-globalconfiguration></app-iscsi-globalconfiguration>
        </md-tab>
        <md-tab label="Portals">
          <div class="iscsi-padding">
            <app-iscsi-portal-list></app-iscsi-portal-list>
          </div>
        </md-tab>
        <md-tab label="Initiators" class="iscsi-padding">
          <div class="iscsi-padding">
            <app-iscsi-initiator-list></app-iscsi-initiator-list>
          </div>
        </md-tab>
        <md-tab label="Authorized Access">
          <div class="iscsi-padding">
            <app-iscsi-authorizedaccess-list></app-iscsi-authorizedaccess-list>
          </div>
        </md-tab>
        <md-tab label="Targets">
          <div class="iscsi-padding">
            <app-iscsi-target-list></app-iscsi-target-list>
          </div>
        </md-tab>
        <md-tab label="Extents">
          <div class="iscsi-padding">
            <app-iscsi-extent-list></app-iscsi-extent-list>
          </div>
        </md-tab>
        <md-tab label="Associated Targets">
          <div class="iscsi-padding">
            <app-iscsi-associated-target-list></app-iscsi-associated-target-list>
          </div>
        </md-tab>
      </md-tab-group>
    </md-card>
  `,
  styleUrls: ['./iscsi.component.css']
})
export class ISCSI implements OnInit{

   @ViewChild('tabGroup') tabGroup;
   protected indexMap: any[] = ['configuration', 'portals', 'initiator', 'auth', 'target', 'extent', 'associatedtarget'];

  constructor( protected router: Router, protected aroute: ActivatedRoute, ) {}

  ngOnInit() {
    this.aroute.params.subscribe(params => {
      this.selectTab(params['pk']);
    });
  }

  selectTab(tabName: any) {
    let index = _.indexOf(this.indexMap, tabName);
    this.tabGroup.selectedIndex = index;
  }

  onSelectChange($event: any) {
    //update url
    let pk = this.indexMap[$event.index];
    this.router.navigate(new Array('/sharing/iscsi').concat(pk));
  }
}

import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import * as _ from 'lodash';
import { WebSocketService, IscsiService } from 'app/services';
import { T } from "app/translate-marker";

@Component({
  selector: 'iscsi',
  templateUrl: './iscsi.component.html',
  providers: [IscsiService]
})
export class ISCSI implements OnInit {

  @ViewChild('tabGroup', { static: true}) tabGroup;

  public activedTab: string = 'configuration';
  public navLinks: Array < any > = [{
      label: T('Target Global Configuration'),
      path: '/sharing/iscsi/configuration',
    },
    {
      label: T('Portals'),
      path: '/sharing/iscsi/portals',
    },
    {
      label: T('Initiators Groups'),
      path: '/sharing/iscsi/initiator',
    },
    {
      label: T('Authorized Access'),
      path: '/sharing/iscsi/auth',
    },
    {
      label: T('Targets'),
      path: '/sharing/iscsi/target',
    },
    {
      label: T('Extents'),
      path: '/sharing/iscsi/extent',
    },
    {
      label: T('Associated Targets'),
      path: '/sharing/iscsi/associatedtarget',
    }
  ];
  protected route_wizard = ["sharing", "iscsi", "wizard"];
  public fcEnabled = false;
  constructor(protected router: Router, protected aroute: ActivatedRoute, protected ws: WebSocketService) {}

  ngOnInit() {
    this.ws.call('system.info').subscribe(
      (res) => {
        if (res.license && res.license.features.indexOf('FIBRECHANNEL') > -1) {
          this.fcEnabled = true;
          this.navLinks.push( {
            label: T('Fibre Channel Ports'),
            path: '/sharing/iscsi/fibrechannel',
          });
        }
      }
    )
    this.aroute.params.subscribe(params => {
      this.activedTab = params['pk'];
    });
  }

  gotoWizard() {
    this.router.navigate(new Array('/').concat(this.route_wizard));
  }
}

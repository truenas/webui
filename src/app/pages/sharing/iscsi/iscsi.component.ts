import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import * as _ from 'lodash';
import { WebSocketService } from 'app/services';

@Component({
  selector: 'iscsi',
  templateUrl: './iscsi.component.html',
})
export class ISCSI implements OnInit {

  @ViewChild('tabGroup', { static: true}) tabGroup;

  public activedTab: string = 'configuration';
  public navLinks: Array < any > = [{
      label: 'Target Global Configuration',
      path: '/sharing/iscsi/configuration',
    },
    {
      label: 'Portals',
      path: '/sharing/iscsi/portals',
    },
    {
      label: 'Initiators',
      path: '/sharing/iscsi/initiator',
    },
    {
      label: 'Authorized Access',
      path: '/sharing/iscsi/auth',
    },
    {
      label: 'Targets',
      path: '/sharing/iscsi/target',
    },
    {
      label: 'Extents',
      path: '/sharing/iscsi/extent',
    },
    {
      label: 'Associated Targets',
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
            label: 'Fibre Channel Ports',
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

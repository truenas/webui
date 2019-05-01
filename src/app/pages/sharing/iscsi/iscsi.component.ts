import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import * as _ from 'lodash';

@Component({
  selector: 'iscsi',
  templateUrl: './iscsi.component.html',
})
export class ISCSI implements OnInit {

  @ViewChild('tabGroup') tabGroup;

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
    },
  ];
  protected route_wizard = ["sharing", "iscsi", "wizard"];
  constructor(protected router: Router, protected aroute: ActivatedRoute, ) {}

  ngOnInit() {
    this.aroute.params.subscribe(params => {
      this.activedTab = params['pk'];
    });
  }

  gotoWizard() {
    this.router.navigate(new Array('/').concat(this.route_wizard));
  }
}

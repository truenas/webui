import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { EntityFormComponent } from '../../../common/entity/entity-form';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { T } from '../../../../translate-marker';
import { Validators } from '@angular/forms';

@Component({
  selector: 'app-iscsi-globalconfiguration',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class GlobalconfigurationComponent {

  protected resource_name: string = 'services/iscsi/globalconfiguration/';

  public fieldConfig: FieldConfig[] = [{
      type: 'input',
      name: 'iscsi_basename',
      placeholder: T('Base Name'),
      tooltip: T('See the "Constructing iSCSI names using the iqn.format"\
 section of <a href="https://tools.ietf.org/html/rfc3721.html"\
 target="_blank">RFC3721</a> if unfamiliar with this format.'),
      required: true,
      validation: [Validators.required]
    },
    {
      type: 'textarea',
      name: 'iscsi_isns_servers',
      placeholder: T('ISNS Servers'),
      tooltip: T('Space delimited list of hostnames or IP addresses of\
 ISNS servers with which to register the iSCSI targets of the system\
 and portals.')
    },
    {
      type: 'input',
      name: 'iscsi_pool_avail_threshold',
      placeholder: T('Pool Available Space Threshold (%)'),
      tooltip: T('Enter the percentage of free space that should remain\
 in the pool. When this percentage is reached, the system issues an\
 alert, but only if zvols are used. See\
 <a href="http://doc.freenas.org/11/vaai.html#vaai" target="_blank">\
 VAAI Threshold Warning.'),
      inputType: 'number',
    },
  ];

  constructor(protected router: Router, protected route: ActivatedRoute) {}

  afterInit(entityEdit: any) {}
}

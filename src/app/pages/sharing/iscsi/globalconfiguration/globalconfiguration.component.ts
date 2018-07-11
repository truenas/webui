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
      tooltip: T('See the <i>Constructing iSCSI names using the iqn.format</i>\
                  section of <a href="https://tools.ietf.org/html/rfc3721.html"\
                  target="_blank">RFC3721</a> if unfamiliar with\
                  this naming format.'),
      required: true,
      validation: [Validators.required]
    },
    {
      type: 'textarea',
      name: 'iscsi_isns_servers',
      placeholder: T('ISNS Servers'),
      tooltip: T('Enter the hostnames or IP addresses of the\
                  ISNS servers to be registered with the\
                  iSCSI targets and portals of the system.\
                  Separate each entry with a space.')
    },
    {
      type: 'input',
      name: 'iscsi_pool_avail_threshold',
      placeholder: T('Pool Available Space Threshold (%)'),
      tooltip: T('Enter the percentage of free space to remain\
                  in the pool. When this percentage is reached,\
                  the system issues an alert, but only if zvols are used.\
                  See <a href="..//docs/vaai.html#vaai"\
                  target="_blank">VAAI Threshold Warning</a> for more\
                  information.'),
      inputType: 'number',
    },
  ];

  constructor(protected router: Router, protected route: ActivatedRoute) {}

  afterInit(entityEdit: any) {}
}

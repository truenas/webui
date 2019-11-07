import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { DialogService, WebSocketService, AppLoaderService } from '../../../../services';
import * as _ from 'lodash';
import { helptext_sharing_iscsi } from 'app/helptext/sharing';

@Component({
  selector: 'app-iscsi-globalconfiguration',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class GlobalconfigurationComponent {

  protected queryCall: string = 'iscsi.global.config';
  protected editCall: string = 'iscsi.global.update';

  public fieldConfig: FieldConfig[] = [{
      type: 'input',
      name: 'basename',
      placeholder: helptext_sharing_iscsi.globalconf_placeholder_basename,
      tooltip: helptext_sharing_iscsi.globalconf_tooltip_basename,
      required: true,
      validation: helptext_sharing_iscsi.globalconf_validators_basename
    },
    {
      type: 'textarea',
      name: 'isns_servers',
      placeholder: helptext_sharing_iscsi.globalconf_placeholder_isns_servers,
      tooltip: helptext_sharing_iscsi.globalconf_tooltip_isns_servers
    },
    {
      type: 'input',
      name: 'pool_avail_threshold',
      placeholder: helptext_sharing_iscsi.globalconf_placeholder_pool_avail_threshold,
      tooltip: helptext_sharing_iscsi.globalconf_tooltip_pool_avail_threshold,
      inputType: 'number',
    },
    {
      type: 'checkbox',
      name: 'alua',
      placeholder: helptext_sharing_iscsi.globalconf_placeholder_alua,
      tooltip: helptext_sharing_iscsi.globalconf_tooltip_alua,
      isHidden: true,
      disabled: true,
    }
  ];

  constructor(protected router: Router, protected route: ActivatedRoute, protected dialogService: DialogService,
              protected ws: WebSocketService, protected loader: AppLoaderService) {}

  afterInit(entityForm) {
    entityForm.submitFunction = entityForm.editCall;
    this.ws.call('system.is_freenas').subscribe((res)=>{
      if (!res) {
        entityForm.setDisabled('alua', false, false);
      }
    });
  }

  beforeSubmit(value) {
    if (value.isns_servers == "") {
      value.isns_servers = [];
    } else {
     value.isns_servers = _.split(value.isns_servers, ' ');
    }

    if (value.pool_avail_threshold == "") {
      value.pool_avail_threshold = null;
    }
  }

  afterSubmit(data) {
    this.ws.call('service.query', [[]]).subscribe((service_res) => {
      const service = _.find(service_res, {"service": "iscsitarget"});
      if (!service['enable']) {
        this.dialogService.confirm(helptext_sharing_iscsi.globalconf_dialog_title,
          helptext_sharing_iscsi.globalconf_dialog_message,
          true, helptext_sharing_iscsi.globalconf_dialog_button).subscribe((dialogRes) => {
            if (dialogRes) {
              this.loader.open();
              this.ws.call('service.update', [service['id'], { enable: true }]).subscribe((updateRes) => {
                this.ws.call('service.start', [service.service]).subscribe((startRes) => {
                  this.loader.close();
                  this.dialogService.Info(helptext_sharing_iscsi.globalconf_start_service_dialog.titlle, helptext_sharing_iscsi.globalconf_start_service_dialog.content);
                }, (err) => {
                  this.loader.close();
                  this.dialogService.errorReport(err.error, err.reason, err.trace.formatted);
                });
               }, (err) => {
                this.loader.close();
                this.dialogService.errorReport(err.error, err.reason, err.trace.formatted);
               });
           }
        });
      }
    });
  }
}

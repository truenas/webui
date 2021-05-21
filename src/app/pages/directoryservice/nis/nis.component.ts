import { ApplicationRef, Component, Injector } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { DialogService } from '../../../services';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import helptext from '../../../helptext/directoryservice/nis';

import {
  RestService,
  SystemGeneralService,
  WebSocketService,
} from '../../../services';
import {
  FieldConfig,
} from '../../common/entity/entity-form/models/field-config.interface';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';

@Component({
  selector: 'app-nis',
  template: '<entity-form [conf]="this"></entity-form>',
})

export class NISComponent implements FormConfiguration {
  queryCall: 'nis.config' = 'nis.config';
  addCall: 'nis.update' = 'nis.update';
  custActions: any[] = [
    {
      id: helptext.nis_custactions_clearcache_id,
      name: helptext.nis_custactions_clearcache_name,
      function: async () => {
        this.systemGeneralService.refreshDirServicesCache().subscribe((cache_status) => {
          this.dialogservice.Info(helptext.nis_custactions_clearcache_dialog_title,
            helptext.nis_custactions_clearcache_dialog_message);
        });
      },
    },
  ];

  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet[] = [
    {
      name: helptext.nis_label,
      class: 'nis',
      label: true,
      config: [
        {
          type: 'input',
          name: 'domain',
          placeholder: helptext.nis_domain_placeholder,
          tooltip: helptext.nis_domain_tooltip,
          required: true,
          validation: helptext.nis_domain_validation,
        },
        {
          type: 'chip',
          name: 'servers',
          placeholder: helptext.nis_servers_placeholder,
          tooltip: helptext.nis_servers_tooltip,
        },
        {
          type: 'checkbox',
          name: 'secure_mode',
          placeholder: helptext.nis_secure_mode_placeholder,
          tooltip: helptext.nis_secure_mode_tooltip,
        },
        {
          type: 'checkbox',
          name: 'manycast',
          placeholder: helptext.nis_manycast_placeholder,
          tooltip: helptext.nis_manycast_tooltip,
        },
        {
          type: 'checkbox',
          name: 'enable',
          placeholder: helptext.nis_enable_placeholder,
          tooltip: helptext.nis_enable_tooltip,
        },
      ],
    }];

  constructor(protected router: Router, protected route: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected _injector: Injector, protected _appRef: ApplicationRef,
    protected systemGeneralService: SystemGeneralService,
    private dialogservice: DialogService) {}

  afterInit(entityForm: any): void {
    entityForm.submitFunction = (body: any) => this.ws.call(this.addCall, [body]);
  }
}

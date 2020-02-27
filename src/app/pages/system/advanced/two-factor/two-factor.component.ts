import { Component } from '@angular/core';
import * as _ from 'lodash';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { WebSocketService } from 'app/services/';

import { helptext_system_advanced } from 'app/helptext/system/advanced';

@Component({
  selector: 'app-two-factor',
  template: `<entity-form [conf]="this"></entity-form>`,
  // styleUrls: ['./two-factor.component.css']
})
export class TwoFactorComponent {
  protected queryCall = 'auth.twofactor.config';
  protected updateCall = 'auth.twofactor.update';
  private TwoFactorEnabled: boolean;
  
  public fieldConfig: FieldConfig[] = []
  public fieldSets: FieldSet[] = [
    {
      name: helptext_system_advanced.two_factor.form.title,
      width: "100%",
      label: true,
      config: [
        {
          type: "paragraph",
          name: "instructions",
          paraText: helptext_system_advanced.two_factor.form.message,
        },
        {
          type: "select",
          name: "otp_digits",
          placeholder: helptext_system_advanced.two_factor.form.otp.placeholder,
          tooltip: helptext_system_advanced.two_factor.form.otp.tooltip,
          options: [
            { label: 6, value: 6 },
            { label: 7, value: 7 },
            { label: 8, value: 8 },
          ],
          required: true,
          value: 6
        },
        {
          type: 'input',
          name: 'interval',
          inputType: 'number',
          placeholder: helptext_system_advanced.two_factor.form.interval.placeholder,
          tooltip: helptext_system_advanced.two_factor.form.interval.tooltip,
          value: 30
        },
        {
          type: 'input',
          name: 'window',
          inputType: 'number',
          placeholder: helptext_system_advanced.two_factor.form.window.placeholder,
          tooltip: helptext_system_advanced.two_factor.form.window.tooltip,
        },
        {
          type: 'checkbox',
          name: 'ssh',
          placeholder: helptext_system_advanced.two_factor.form.services.placeholder,
          tooltip: helptext_system_advanced.two_factor.form.services.tooltip,
        },
        {
          type: 'input',
          name: 'secret',
          inputType: 'password',
          togglePw: true,
          placeholder: helptext_system_advanced.two_factor.form.secret.placeholder,
          tooltip: helptext_system_advanced.two_factor.form.secret.tooltip,
          value: 'Whatevs',
          readonly: true,
        },
        {
          type: 'input',
          name: 'uri',
          inputType: 'password',
          togglePw: true,
          placeholder: helptext_system_advanced.two_factor.form.uri.placeholder,
          tooltip: helptext_system_advanced.two_factor.form.uri.tooltip,
          readonly: true,
        },
        {
          type: "paragraph",
          name: "enabled_status",
          paraText: ''
        },


      ]
    }
  ]

  constructor(protected ws: WebSocketService) { }

  resourceTransformIncomingRestData(data) {
    data.ssh = data.services.ssh;
    this.TwoFactorEnabled = data.enabled;
    return data;
  }

  afterInit(entityEdit: any) {
    this.ws.call('auth.twofactor.provisioning_uri').subscribe(res => {
      entityEdit.formGroup.controls['uri'].setValue(res);
      let enabled = _.find(this.fieldConfig, { name: 'enabled_status' });
      res.enabled ? 
        enabled.paraText = helptext_system_advanced.two_factor.form.enabled_status_true :
        enabled.paraText = helptext_system_advanced.two_factor.form.enabled_status_false;
    })
  }

  beforeSubmit(data) {
    data.enabled = this.TwoFactorEnabled;
    data.services = { ssh: data.ssh };
    const extras = ['instructions', 'enabled_status', 'secret', 'uri', 'ssh'];
    extras.map(extra => {
      delete data[extra];
    })
    console.log(data)
  }
 
}

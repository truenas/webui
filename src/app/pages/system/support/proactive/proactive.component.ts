import { Component } from '@angular/core';
import * as _ from 'lodash';
import { WebSocketService } from 'app/services/';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { DialogService } from 'app/services/dialog.service';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { helptext_system_support as helptext } from 'app/helptext/system/support';

@Component({
  selector: 'app-proactive',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class ProactiveComponent {
  public entityEdit: any;
  protected queryCall = 'support.config';
  public contacts: any;
  public controls: any;
  public save_button_enabled: boolean;
  public fieldConfig: FieldConfig[] = []
  public fieldSets: FieldSet[] = [
  {
    name: 'title_row',
    label: false,
    width: '100%',
    config:[
      {
        type: 'paragraph',
        name: 'TN_proactive_section_title',
        paraText: '<i class="material-icons">swap_horiz</i>' + helptext.proactive.title
      },
      {
        type: 'paragraph',
        name: 'TN_proactive_instructions',
        paraText: helptext.proactive.instructions
      },
    ]
  },
  {
    name: 'col1',
    label: false,
    width: '47%',
    config:[
      {
        type: 'paragraph',
        name: 'TN_proactive_title',
        paraText: helptext.proactive.primary_contact
      },
      {
        type: 'input',
        name: 'name',
        placeholder : helptext.proactive.pc_name_placeholder,
        required: true,
        validation : helptext.proactive.pc_validation,
        relation: [{
          action: 'DISABLE',
          when: [{
              name: 'enabled',
              value: false,
          }]
        }]
      },
      {
        type: 'input',
        name: 'title',
        placeholder : helptext.proactive.pc_title_placeholder,
        required: true,
        validation : helptext.proactive.pc_validation,
        relation: [{
          action: 'DISABLE',
          when: [{
              name: 'enabled',
              value: false,
          }]
        }]
      },
      {
        type: 'input',
        name: 'email',
        placeholder : helptext.proactive.pc_email_placeholder,
        required: true,
        validation : helptext.proactive.pc_email_validation,
        relation: [{
          action: 'DISABLE',
          when: [{
              name: 'enabled',
              value: false,
          }]
        }]
      },
      {
        type: 'input',
        name: 'phone',
        placeholder : helptext.proactive.pc_phone_placeholder,
        required: true,
        validation : helptext.proactive.pc_validation,
        relation: [{
          action: 'DISABLE',
          when: [{
              name: 'enabled',
              value: false,
          }]
        }]
      },
    ]
  },
  {
    name: 'middle',
    label: false,
    width: '5%',
    config:[]
  },
  {
    name: 'col2',
    label: false,
    width: '47%',
    config:[
      {
        type: 'paragraph',
        name: 'TN_proactive_second_title',
        paraText: helptext.proactive.secondary_contact
      },
      {
        type: 'input',
        name: 'secondary_name',
        placeholder : helptext.proactive.sec_name_placeholder,
        required: true,
        validation : helptext.proactive.pc_validation,
        relation: [{
          action: 'DISABLE',
          when: [{
              name: 'enabled',
              value: false,
          }]
        }]
      },
      {
        type: 'input',
        name: 'secondary_title',
        placeholder :  helptext.proactive.sec_title_placeholder,
        required: true,
        validation : helptext.proactive.pc_validation,
        relation: [{
          action: 'DISABLE',
          when: [{
              name: 'enabled',
              value: false,
          }]
        }]
      },
      {
        type: 'input',
        name: 'secondary_email',
        placeholder : helptext.proactive.sec_email_placeholder,
        validation: helptext.proactive.sec_email_validation,
        required: true,
        relation: [{
          action: 'DISABLE',
          when: [{
              name: 'enabled',
              value: false,
          }]
        }]
      },
      {
        type: 'input',
        name: 'secondary_phone',
        placeholder : helptext.proactive.sec_phone_placeholder,
        required: true,
        validation : helptext.proactive.pc_validation,
        relation: [{
          action: 'DISABLE',
          when: [{
              name: 'enabled',
              value: false,
          }]
        }]
      }
    ]
  },
  {
    name: 'enabled',
    label: false,
    width: '100%',
    config:[
      {
        type: 'checkbox',
        name: 'enabled',
        placeholder: helptext.proactive.enable_checkbox_placeholder,
      }
    ]
  },
]

  constructor(public ws: WebSocketService, protected loader: AppLoaderService, 
    protected dialogService: DialogService) { }

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
    const proactiveFields: Array<any> = [
      'name',
      'title',
      'email',
      'phone',
      'secondary_name',
      'secondary_title',
      'secondary_email',
      'secondary_phone',
      'TN_proactive_title',
      'enabled'
    ];

    const proactiveParatext: Array<any> = [
      'TN_proactive_section_title',
      'TN_proactive_instructions',
      'TN_proactive_title',
      'TN_proactive_second_title',
    ];

    setTimeout(() => {
      this.ws.call('support.is_available').subscribe((res) => { 
        if (!res) {
          for (const i in proactiveFields) {
            this.entityEdit.setDisabled(proactiveFields[i], true, false);
            proactiveParatext.forEach((i) => {
              document.getElementById(i).style.opacity = '0.38';
            });
          };
          this.save_button_enabled = false;
        } else {
          this.getContacts();
          this.save_button_enabled = true;
          this.ws.call('support.is_available_and_enabled').subscribe((res) => {
            if (res) {
              this.entityEdit.formGroup.controls['enabled'].setValue(true);
            } else {
              this.entityEdit.formGroup.controls['enabled'].setValue(false);
            }
          });
        }
      })
    }, 1000);
  }

  getContacts() {
    this.controls = this.entityEdit.formGroup.controls;
    this.ws.call(this.queryCall).subscribe((res) => {
      if (res && res !== {}) {
        for (const i in res) {
          if (i !== 'id') {
            this.controls[i].setValue(res[i])
          }
        }
      }
    })
  }

  beforeSubmit(data) {
    delete data.TN_proactive_instructions;
    delete data.TN_proactive_second_title;
    delete data.TN_proactive_section_border;
    delete data.TN_proactive_section_title
    delete data.TN_proactive_title;
    if (!data.enabled) {
      data.enabled = false;
    }
  }

  customSubmit(data) {
    this.loader.open();
    this.ws.call('support.update', [data]).subscribe(() => {
      this.loader.close();
      this.dialogService.Info(helptext.proactive.dialog_title, 
        helptext.proactive.dialog_mesage, '350px', 'info', true);
    }, 
    (err) => {
      this.loader.close();
      this.dialogService.errorReport(helptext.proactive.dialog_err,
        err.error.message, err.error.traceback);
    });
  };

}

import { Component, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { WebSocketService } from 'app/services/';
import { PreferencesService } from 'app/core/services/preferences.service';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { helptext_system_support as helptext } from 'app/helptext/system/support';

@Component({
  selector: 'app-proactive',
  template : `<entity-form [conf]="this"></entity-form>`,
  styleUrls: ['./proactive.component.css']
})
export class ProactiveComponent implements OnInit {
  public entityEdit: any;
  public addCall: 'support.update';
  public contacts: any;
  public controls: any;
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
        validation : helptext.proactive.pc_validation
      },
      {
        type: 'input',
        name: 'title',
        placeholder : helptext.proactive.pc_title_placeholder,
        required: true,
        validation : helptext.proactive.pc_validation
      },
      {
        type: 'input',
        name: 'email',
        placeholder : helptext.proactive.pc_email_placeholder,
        required: true,
        validation : helptext.proactive.pc_email_validation,
      },
      {
        type: 'input',
        name: 'phone',
        placeholder : helptext.proactive.pc_phone_placeholder,
        required: true,
        validation : helptext.proactive.pc_validation,
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
        validation : helptext.proactive.pc_validation
      },
      {
        type: 'input',
        name: 'secondary_title',
        placeholder :  helptext.proactive.sec_title_placeholder,
        required: true,
        validation : helptext.proactive.pc_validation
      },
      {
        type: 'input',
        name: 'secondary_email',
        placeholder : helptext.proactive.sec_email_placeholder,
        validation: helptext.proactive.sec_email_validation,
        required: true,
      },
      {
        type: 'input',
        name: 'secondary_phone',
        placeholder : helptext.proactive.sec_phone_placeholder,
        required: true,
        validation : helptext.proactive.pc_validation
      }
    ]
  },
  {
    name: 'enablec',
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

  constructor(public ws: WebSocketService, protected prefService: PreferencesService) { }

  ngOnInit() {
  }

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

    this.ws.call('support.is_available').subscribe((res) => { console.log(res)
      if (!res) {
        for (const i in proactiveFields) {
          this.entityEdit.setDisabled(proactiveFields[i], true, false);
          proactiveParatext.forEach((i) => {
            document.getElementById(i).style.opacity = '0.38';
          });
        };
      } else {
        this.getContacts();
        this.ws.call('support.is_available_and_enabled').subscribe((res) => {
          if (res) {
            this.entityEdit.formGroup.controls['enabled'].setValue(true);
          } else {
            this.entityEdit.formGroup.controls['enabled'].setValue(false);
          }
        });
      }
    })
  }

  getContacts() {
    _.find(this.fieldConfig, {name : "name"}).isLoading = true;
    _.find(this.fieldConfig, {name : "secondary_name"}).isLoading = true;
    this.controls = this.entityEdit.formGroup.controls;
    setTimeout(() => {
      this.contacts = this.prefService.preferences.proactiveSupportContacts;
      if (this.contacts.length > 0) {
        for (const i in this.contacts[0]) {
          this.controls[i].setValue(this.contacts[0][i])
        }
      }
      _.find(this.fieldConfig, {name : "name"}).isLoading = false;
      _.find(this.fieldConfig, {name : "secondary_name"}).isLoading = false;
    }, 2200);
  }

  beforeSubmit(data) {
    delete data.TN_proactive_instructions;
    delete data.TN_proactive_second_title;
    delete data.TN_proactive_section_border;
    delete data.TN_proactive_section_title
    delete data.TN_proactive_title;

    this.contacts = this.prefService.preferences.proactiveSupportContacts;
    this.contacts.length = 0;
    this.contacts.push(data);
    this.prefService.savePreferences(this.prefService.preferences);
  }

  customSubmit() {
    console.log('do not submit :)')
  }

}

import { Component } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { helptext_system_support as helptext } from 'app/helptext/system/support';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { SupportConfig, SupportConfigUpdate } from 'app/interfaces/support.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { RelationAction } from 'app/pages/common/entity/entity-form/models/relation-action.enum';
import { WebSocketService } from 'app/services/';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { DialogService } from 'app/services/dialog.service';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'app-proactive',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class ProactiveComponent implements FormConfiguration {
  entityEdit: EntityFormComponent;
  queryCall: 'support.config' = 'support.config';
  controls: { [key: string]: AbstractControl };
  save_button_enabled: boolean;
  title = helptext.proactive.title;
  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet[] = [
    {
      name: 'col1',
      label: false,
      config: [
        {
          type: 'paragraph',
          name: 'proactive_title',
          paraText: helptext.proactive.primary_contact,
          tooltip: helptext.proactive.instructions,
        },
        {
          type: 'input',
          name: 'name',
          placeholder: helptext.proactive.pc_name_placeholder,
          required: true,
          validation: helptext.proactive.pc_validation,
          relation: [{
            action: RelationAction.Disable,
            when: [{
              name: 'enabled',
              value: false,
            }],
          }],
        },
        {
          type: 'input',
          name: 'title',
          placeholder: helptext.proactive.pc_title_placeholder,
          required: true,
          validation: helptext.proactive.pc_validation,
          relation: [{
            action: RelationAction.Disable,
            when: [{
              name: 'enabled',
              value: false,
            }],
          }],
        },
        {
          type: 'input',
          name: 'email',
          placeholder: helptext.proactive.pc_email_placeholder,
          required: true,
          validation: helptext.proactive.pc_email_validation,
          relation: [{
            action: RelationAction.Disable,
            when: [{
              name: 'enabled',
              value: false,
            }],
          }],
        },
        {
          type: 'input',
          name: 'phone',
          placeholder: helptext.proactive.pc_phone_placeholder,
          required: true,
          validation: helptext.proactive.pc_validation,
          relation: [{
            action: RelationAction.Disable,
            when: [{
              name: 'enabled',
              value: false,
            }],
          }],
        },
      ],
    },
    {
      name: 'col2',
      label: false,
      config: [
        {
          type: 'paragraph',
          name: 'proactive_second_title',
          paraText: helptext.proactive.secondary_contact,
        },
        {
          type: 'input',
          name: 'secondary_name',
          placeholder: helptext.proactive.sec_name_placeholder,
          required: true,
          validation: helptext.proactive.pc_validation,
          relation: [{
            action: RelationAction.Disable,
            when: [{
              name: 'enabled',
              value: false,
            }],
          }],
        },
        {
          type: 'input',
          name: 'secondary_title',
          placeholder: helptext.proactive.sec_title_placeholder,
          required: true,
          validation: helptext.proactive.pc_validation,
          relation: [{
            action: RelationAction.Disable,
            when: [{
              name: 'enabled',
              value: false,
            }],
          }],
        },
        {
          type: 'input',
          name: 'secondary_email',
          placeholder: helptext.proactive.sec_email_placeholder,
          validation: helptext.proactive.sec_email_validation,
          required: true,
          relation: [{
            action: RelationAction.Disable,
            when: [{
              name: 'enabled',
              value: false,
            }],
          }],
        },
        {
          type: 'input',
          name: 'secondary_phone',
          placeholder: helptext.proactive.sec_phone_placeholder,
          required: true,
          validation: helptext.proactive.pc_validation,
          relation: [{
            action: RelationAction.Disable,
            when: [{
              name: 'enabled',
              value: false,
            }],
          }],
        },
      ],
    },
    {
      name: 'enabled',
      label: false,
      width: '100%',
      config: [
        {
          type: 'checkbox',
          name: 'enabled',
          placeholder: helptext.proactive.enable_checkbox_placeholder,
        },
      ],
    },
  ];

  constructor(public ws: WebSocketService, protected loader: AppLoaderService,
    protected dialogService: DialogService, private translate: TranslateService,
    private modalService: ModalService) { }

  afterInit(entityEdit: EntityFormComponent): void {
    this.entityEdit = entityEdit;
    const proactiveFields = [
      'enabled',
      'name',
      'title',
      'email',
      'phone',
      'secondary_name',
      'secondary_title',
      'secondary_email',
      'secondary_phone',
      'proactive_title',
    ];

    const proactiveParatext = [
      'proactive_instructions',
      'proactive_title',
      'proactive_second_title',
    ];

    setTimeout(() => {
      this.ws.call('support.is_available').pipe(untilDestroyed(this)).subscribe((res) => {
        if (!res) {
          proactiveFields.forEach((field) => {
            this.entityEdit.setDisabled(field, true, false);
            proactiveParatext.forEach((i) => {
              document.getElementById(i).style.opacity = '0.38';
            });
          });
          this.save_button_enabled = false;
        } else {
          this.getContacts();
          this.save_button_enabled = true;
          this.ws.call('support.is_available_and_enabled').pipe(untilDestroyed(this)).subscribe((res) => {
            if (res) {
              this.entityEdit.formGroup.controls['enabled'].setValue(true);
            } else {
              this.entityEdit.formGroup.controls['enabled'].setValue(false);
            }
          });
        }
      });
    }, 1000);
  }

  getContacts(): void {
    this.controls = this.entityEdit.formGroup.controls;
    this.ws.call(this.queryCall).pipe(untilDestroyed(this)).subscribe((res) => {
      if (res && (res as any) !== {}) {
        for (const i in res) {
          if (i !== 'id') {
            this.controls[i].setValue(res[i as keyof SupportConfig]);
          }
        }
      }
    });
  }

  beforeSubmit(data: any): void {
    delete data.proactive_instructions;
    delete data.proactive_second_title;
    delete data.proactive_section_border;
    delete data.proactive_section_title;
    delete data.proactive_title;
    if (!data.enabled) {
      data.enabled = false;
    }
  }

  customSubmit(data: SupportConfigUpdate): void {
    this.loader.open();
    this.ws.call('support.update', [data]).pipe(untilDestroyed(this)).subscribe(() => {
      this.loader.close();
      this.modalService.close('slide-in-form');
      this.dialogService.info(helptext.proactive.dialog_title,
        helptext.proactive.dialog_mesage, '350px', 'info', true);
    },
    (err) => {
      this.loader.close();
      this.dialogService.errorReport(helptext.proactive.dialog_err,
        err.error.message, err.error.traceback);
    });
  }
}

import { Component } from '@angular/core';
import { FormControl, ValidatorFn } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { helptextSystemSupport as helptext } from 'app/helptext/system/support';
import { FormCustomAction, FormConfiguration } from 'app/interfaces/entity-form.interface';
import { Job } from 'app/interfaces/job.interface';
import { Subs } from 'app/interfaces/subs.interface';
import { CreateNewTicket, NewTicketResponse } from 'app/interfaces/support.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { AppLoaderService } from 'app/modules/app-loader/app-loader.service';
import { FormUploadComponent } from 'app/modules/entity/entity-form/components/form-upload/form-upload.component';
import { EntityFormComponent } from 'app/modules/entity/entity-form/entity-form.component';
import { FieldConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/modules/entity/entity-form/models/fieldset.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/modules/entity/utils';
import { WebSocketService } from 'app/services/';
import { DialogService } from 'app/services/dialog.service';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'app-support-form-licensed',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class SupportFormLicensedComponent implements FormConfiguration {
  entityEdit: EntityFormComponent;
  screenshot: FieldConfig;
  subs: Subs[];
  saveSubmitText = helptext.submitBtn;
  title = helptext.ticket;
  customActions: FormCustomAction[] = [];
  maxUploadSizeMibs: number;
  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet[] = [
    {
      name: 'column1',
      label: false,
      config: [
        {
          type: 'input',
          name: 'name',
          placeholder: helptext.name.placeholder,
          tooltip: helptext.name.tooltip,
          required: true,
          validation: helptext.name.validation,
        },
        {
          type: 'input',
          name: 'email',
          placeholder: helptext.email.placeholder,
          tooltip: helptext.email.tooltip,
          required: true,
          validation: helptext.email.validation,
        },
        {
          type: 'chip',
          name: 'cc',
          placeholder: helptext.cc.placeholder,
          tooltip: helptext.cc.tooltip,
          validation: [this.emailListValidator('cc')],
        },
        {
          type: 'input',
          name: 'phone',
          placeholder: helptext.phone.placeholder,
          tooltip: helptext.phone.tooltip,
          required: true,
          validation: helptext.phone.validation,
        },
        {
          type: 'select',
          name: 'TNCategory',
          placeholder: helptext.type.placeholder,
          tooltip: helptext.type.tooltip,
          options: [
            { label: 'Bug', value: 'BUG' },
            { label: 'Hardware', value: 'HARDWARE' },
            { label: 'Installation/Setup', value: 'INSTALL' },
            { label: 'Performance', value: 'PERFORMANCE' },
          ],
          value: 'BUG',
        },
        {
          type: 'select',
          name: 'environment',
          placeholder: helptext.environment.placeholder,
          tooltip: helptext.environment.tooltip,
          options: [
            { label: 'Production', value: 'production' },
            { label: 'Staging', value: 'staging' },
            { label: 'Testing', value: 'testing' },
            { label: 'Prototyping', value: 'prototyping' },
            { label: 'Initial Deployment/Setup', value: 'initial' },
          ],
          validation: helptext.environment.validation,
          value: 'production',
        },
      ],
    },
    {
      name: 'col2',
      label: false,
      class: 'lowerme',
      config: [
        {
          type: 'select',
          name: 'criticality',
          placeholder: helptext.criticality.placeholder,
          tooltip: helptext.criticality.tooltip,
          options: [
            { label: 'Inquiry', value: 'inquiry' },
            { label: 'Loss of Functionality', value: 'loss_functionality' },
            { label: 'Total Down', value: 'total_down' },
          ],
          validation: helptext.criticality.validation,
          value: 'inquiry',
        },
        {
          type: 'input',
          name: 'title',
          placeholder: helptext.title.placeholder,
          tooltip: helptext.title.tooltip,
          required: true,
          validation: helptext.title.validation,
        },
        {
          type: 'textarea',
          name: 'body',
          placeholder: helptext.body.placeholder,
          tooltip: helptext.body.tooltip,
          required: true,
          validation: helptext.body.validation,
          textAreaRows: 8,
        },
        {
          type: 'checkbox',
          name: 'attach_debug',
          placeholder: helptext.attach_debug.placeholder,
          tooltip: helptext.attach_debug.tooltip,
        },
        {
          type: 'upload',
          name: 'screenshot',
          placeholder: helptext.screenshot.placeholder,
          tooltip: helptext.screenshot.tooltip,
          fileLocation: '',
          updater: (file: FormUploadComponent) => this.updater(file),
          parent: this,
          hideButton: true,
          hasErrors: true,
          multiple: true,
        },
      ],
    },
  ];

  constructor(public dialog: MatDialog, public loader: AppLoaderService,
    private translate: TranslateService, public ws: WebSocketService,
    public dialogService: DialogService, public router: Router,
    private modalService: ModalService) { }

  afterInit(entityEdit: EntityFormComponent): void {
    this.entityEdit = entityEdit;
    this.customActions = [
      {
        id: 'userguide',
        name: helptext.update_license.user_guide_button,
        function: () => {
          // TODO: Need updated address before release
          window.open('https://www.truenas.com/docs/hub/');
        },
      },
      {
        id: 'eula',
        name: helptext.update_license.eula_button,
        function: () => {
          this.modalService.closeSlideIn();
          this.router.navigate(['/system/support/eula']);
        },
      },
    ];

    this.loader.open();
    this.ws.call('support.attach_ticket_max_size').pipe(untilDestroyed(this)).subscribe(
      (sizeMibs: number) => {
        this.loader.close();
        this.maxUploadSizeMibs = sizeMibs;
      },
      (err: WebsocketError) => {
        new EntityUtils().handleError(this, err);
        // This request is a prereq for this form to function successfully.
        // Which means if it errors out, the form should be closed or navigated away
        this.resetForm();
      },
    );
  }

  emailListValidator(name: string): ValidatorFn {
    return (control: FormControl) => {
      const emailListConfig = this.fieldConfig.find((config) => config.name === name);
      if (control.value) {
        let counter = 0;
        const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        if (control.value) {
          control.value.forEach((item: string) => {
            if (!item.match(regex)) {
              counter++;
            }
          });
        }

        const errors = control.value && control.value.length > 0 && counter > 0
          ? { validEmails: true }
          : null;

        if (errors) {
          emailListConfig.hasErrors = true;
          emailListConfig.errors = helptext.cc.err;
        } else {
          emailListConfig.hasErrors = false;
          emailListConfig.errors = '';
        }

        return errors;
      }
    };
  }

  customSubmit(entityEdit: any): void {
    const payload: any = {};
    payload['name'] = entityEdit.name;
    payload['email'] = entityEdit.email;
    if (entityEdit.cc) {
      payload['cc'] = entityEdit.cc;
    }
    payload['phone'] = entityEdit.phone;
    payload['category'] = entityEdit.TNCategory;
    payload['environment'] = entityEdit.environment;
    payload['criticality'] = entityEdit.criticality;
    payload['attach_debug'] = entityEdit.attach_debug || false;
    payload['title'] = entityEdit.title;
    payload['body'] = entityEdit.body;
    this.openDialog(payload);
  }

  openDialog(payload: CreateNewTicket): void {
    const dialogRef = this.dialog.open(EntityJobComponent, { data: { title: 'Ticket', closeOnClickOutside: true } });
    let description: string;
    dialogRef.componentInstance.setCall('support.new_ticket', [payload]);
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe((res: Job<NewTicketResponse>) => {
      if (res.result) {
        const url = `<a href="${res.result.url}" target="_blank" style="text-decoration:underline;">${res.result.url}</a>`;
        if (!res.result.has_debug && payload.attach_debug) {
          description = this.translate.instant(helptext.debugSizeLimitWarning + '\n' + url);
        } else {
          description = url;
        }
      }
      if (res.method === 'support.new_ticket' && this.subs && this.subs.length > 0) {
        this.subs.forEach((item) => {
          const formData: FormData = new FormData();
          formData.append('data', JSON.stringify({
            method: 'support.attach_ticket',
            params: [{ ticket: (res.result.ticket), filename: item.file.name }],
          }));
          formData.append('file', item.file, item.apiEndPoint);
          dialogRef.componentInstance.wspost(item.apiEndPoint, formData);
          dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
            this.resetForm();
          });
          dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((res) => {
            dialogRef.componentInstance.setDescription(res.error);
          });
        });
        dialogRef.componentInstance.setDescription(description);
      } else {
        dialogRef.componentInstance.setDescription(description);
        this.resetForm();
      }
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((res) => {
      dialogRef.componentInstance.setDescription(res.error);
    });
  }

  updater(file: FormUploadComponent): void {
    this.subs = [];
    const fileBrowser = file.fileInput.nativeElement;
    this.screenshot = _.find(this.fieldConfig, { name: 'screenshot' });
    this.screenshot['hasErrors'] = false;
    if (fileBrowser.files && fileBrowser.files[0]) {
      for (const browserFile of fileBrowser.files) {
        if (browserFile.size >= (this.maxUploadSizeMibs * 1024 * 1024)) {
          this.screenshot['hasErrors'] = true;
          this.screenshot['errors'] = this.translate.instant(
            'File size is limited to {maxUploadSizeMibs} MiB.',
            { maxUploadSizeMibs: this.maxUploadSizeMibs },
          );
        } else {
          this.subs.push({ apiEndPoint: file.apiEndPoint, file: browserFile });
        }
      }
    }
  }

  resetForm(): void {
    this.entityEdit.formGroup.reset();
    this.entityEdit.formGroup.controls['TNCategory'].setValue('BUG');
    this.entityEdit.formGroup.controls['environment'].setValue('production');
    this.entityEdit.formGroup.controls['criticality'].setValue('inquiry');
    this.subs = [];
    this.modalService.closeSlideIn();
  }
}

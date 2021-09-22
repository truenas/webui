import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { NewTicketType } from 'app/enums/new-ticket-type.enum';
import { helptext_system_support as helptext } from 'app/helptext/system/support';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { Job } from 'app/interfaces/job.interface';
import { CreateNewTicket, NewTicketResponse } from 'app/interfaces/support.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityJobComponent } from 'app/pages//common/entity/entity-job/entity-job.component';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FormUploadComponent } from 'app/pages/common/entity/entity-form/components/form-upload/form-upload.component';
import { FieldConfig, FormSelectConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { WebSocketService } from 'app/services/';
import { ModalService } from 'app/services/modal.service';
import { T } from 'app/translate-marker';

@UntilDestroy()
@Component({
  selector: 'app-support-form-unlicensed',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class SupportFormUnlicensedComponent implements FormConfiguration {
  entityEdit: EntityFormComponent;
  password: any;
  username: any;
  category: FormSelectConfig;
  screenshot: FieldConfig;
  password_fc: FieldConfig;
  username_fc: FieldConfig;
  subs: any[];
  saveSubmitText = helptext.submitBtn;
  isEntity = true;
  title = helptext.ticket;
  protected isOneColumnForm = true;

  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet<this>[] = [
    {
      name: 'column1',
      label: false,
      config: [
        {
          type: 'paragraph',
          name: 'FN_jira-info',
          paraText: helptext.FN_Jira_message,
        },
        {
          type: 'input',
          name: 'username',
          placeholder: helptext.username.placeholder,
          tooltip: helptext.username.tooltip,
          required: true,
          validation: helptext.username.validation,
          blurStatus: true,
          blurEvent: this.usernameOrPasswordBlur,
          parent: this,
          value: '',
        },
        {
          type: 'input',
          name: 'password',
          inputType: 'password',
          placeholder: helptext.password.placeholder,
          tooltip: helptext.password.tooltip,
          required: true,
          validation: helptext.password.validation,
          blurStatus: true,
          blurEvent: this.usernameOrPasswordBlur,
          parent: this,
          togglePw: true,
          value: '',
        },
        {
          type: 'select',
          name: 'type',
          placeholder: helptext.type.placeholder,
          tooltip: helptext.type.tooltip,
          options: [
            { label: T('Bug'), value: NewTicketType.Bug },
            { label: T('Feature'), value: NewTicketType.Feature },
          ],
          value: NewTicketType.Bug,
        },
        {
          type: 'select',
          name: 'category',
          placeholder: helptext.category.placeholder,
          tooltip: helptext.category.tooltip,
          required: true,
          validation: helptext.category.validation,
          options: [],
          disabled: true,
          isLoading: false,
        },
        {
          type: 'checkbox',
          name: 'attach_debug',
          placeholder: helptext.attach_debug.placeholder,
          tooltip: helptext.attach_debug.tooltip,
          value: false,
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
          type: 'upload',
          name: 'screenshot',
          placeholder: helptext.screenshot.placeholder,
          tooltip: helptext.screenshot.tooltip,
          fileLocation: '',
          updater: this.updater,
          parent: this,
          hideButton: true,
          hasErrors: true,
          multiple: true,
        },
      ],
    },
  ];

  constructor(protected ws: WebSocketService, protected dialog: MatDialog,
    private modalService: ModalService) { }

  afterInit(entityEdit: EntityFormComponent): void {
    this.entityEdit = entityEdit;
  }

  usernameOrPasswordBlur(parent: this): void {
    this.password_fc = _.find(parent.fieldConfig, { name: 'password' });
    this.username_fc = _.find(parent.fieldConfig, { name: 'username' });
    this.category = _.find(parent.fieldConfig, { name: 'category' });
    if (parent.entityEdit) {
      this.username = parent.entityEdit.formGroup.controls['username'].value;
      this.password = parent.entityEdit.formGroup.controls['password'].value;
      this.password_fc['hasErrors'] = false;
      this.password_fc['errors'] = '';
      this.username_fc['hasErrors'] = false;
      this.username_fc['errors'] = '';

      if (this.category.options.length > 0) {
        this.category.options = [];
      }
      if (this.category.options.length === 0 && this.username !== '' && this.password !== '') {
        this.category.isLoading = true;
        parent.ws.call('support.fetch_categories', [this.username, this.password]).pipe(untilDestroyed(this)).subscribe((res) => {
          this.category.isLoading = false;
          parent.entityEdit.setDisabled('category', false);
          const options = [];
          for (const property in res) {
            if (res.hasOwnProperty(property)) {
              options.push({ label: property, value: res[property] });
            }
            this.category.options = _.sortBy(options, ['label']);
          }
        }, (error: WebsocketError) => {
          if (error.reason[0] === '[') {
            while (error.reason[0] !== ' ') {
              error.reason = error.reason.slice(1);
            }
          }
          parent.entityEdit.setDisabled('category', true);
          this.category.isLoading = false;
          this.password_fc['hasErrors'] = true;
          this.password_fc['errors'] = error.reason;
        });
      }
    }
  }

  customSubmit(entityEdit: any): void {
    const payload = {} as CreateNewTicket;
    payload['username'] = entityEdit.username;
    payload['password'] = entityEdit.password;
    payload['category'] = entityEdit.category;
    payload['title'] = entityEdit.title;
    payload['body'] = entityEdit.body;
    payload['type'] = entityEdit.type;
    if (entityEdit.attach_debug) {
      payload['attach_debug'] = entityEdit.attach_debug;
    }
    this.openDialog(payload);
  }

  openDialog(payload: CreateNewTicket): void {
    const dialogRef = this.dialog.open(EntityJobComponent, { data: { title: T('Ticket'), closeOnClickOutside: true } });
    let url: string;
    dialogRef.componentInstance.setCall('support.new_ticket', [payload]);
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe((res: Job<NewTicketResponse>) => {
      if (res.result) {
        url = `<a href="${res.result.url}" target="_blank" style="text-decoration:underline;">${res.result.url}</a>`;
      }
      if (res.method === 'support.new_ticket' && this.subs && this.subs.length > 0) {
        this.subs.forEach((item) => {
          const formData: FormData = new FormData();
          formData.append('data', JSON.stringify({
            method: 'support.attach_ticket',
            params: [{
              ticket: (res.result.ticket), filename: item.file.name, username: payload['username'], password: payload['password'],
            }],
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
        dialogRef.componentInstance.setDescription(url);
      } else {
        dialogRef.componentInstance.setDescription(url);
        this.resetForm();
      }
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((res) => {
      dialogRef.componentInstance.setDescription(res.error);
    });
  }

  resetForm(): void {
    this.entityEdit.formGroup.reset();
    this.entityEdit.formGroup.controls['type'].setValue(NewTicketType.Bug);
    this.subs = [];
    this.modalService.close('slide-in-form');
  }

  updater(file: FormUploadComponent, parent: this): void {
    parent.subs = [];
    const fileBrowser = file.fileInput.nativeElement;
    this.screenshot = _.find(parent.fieldConfig, { name: 'screenshot' });
    this.screenshot['hasErrors'] = false;
    if (fileBrowser.files && fileBrowser.files[0]) {
      for (let i = 0; i < fileBrowser.files.length; i++) {
        if (fileBrowser.files[i].size >= 52428800) {
          this.screenshot['hasErrors'] = true;
          this.screenshot['errors'] = 'File size is limited to 50 MiB.';
        } else {
          parent.subs.push({ apiEndPoint: file.apiEndPoint, file: fileBrowser.files[i] });
        }
      }
    }
  }
}

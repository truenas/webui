import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { NewTicketType } from 'app/enums/new-ticket-type.enum';
import { helptext_system_support as helptext } from 'app/helptext/system/support';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { Job } from 'app/interfaces/job.interface';
import { Subs } from 'app/interfaces/subs.interface';
import { CreateNewTicket, NewTicketResponse, OauthJiraMessage } from 'app/interfaces/support.interface';
import { EntityJobComponent } from 'app/pages//common/entity/entity-job/entity-job.component';
import { FormUploadComponent } from 'app/pages/common/entity/entity-form/components/form-upload/form-upload.component';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import {
  FieldConfig, FormButtonConfig, FormSelectConfig,
} from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { DialogService, WebSocketService } from 'app/services/';
import { ModalService } from 'app/services/modal.service';
import { SystemGeneralService } from 'app/services/system-general.service';

@UntilDestroy()
@Component({
  selector: 'app-support-form-unlicensed',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class SupportFormUnlicensedComponent implements FormConfiguration {
  entityEdit: EntityFormComponent;
  category: FormSelectConfig;
  screenshot: FieldConfig;
  subs: Subs[];
  saveSubmitText = helptext.submitBtn;
  isEntity = true;
  title = helptext.ticket;
  protected isOneColumnForm = true;
  private token: string;

  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet<this>[] = [
    {
      name: 'column1',
      label: false,
      config: [
        {
          type: 'input',
          name: 'token',
          placeholder: helptext.token.placeholder,
          tooltip: helptext.token.tooltip,
          validation: helptext.token.validation,
          value: null,
          required: true,
          readonly: true,
        },
        {
          type: 'button',
          name: 'oauth-jira',
          parent: this,
          customEventActionLabel: this.translate.instant('Login to JIRA'),
          customEventMethod: () => {
            const authFn = (message: OauthJiraMessage): void => this.doAuth(message);

            window.open('https://support-proxy.ixsystems.com/oauth/initiate?origin=' + encodeURIComponent(window.location.toString()), '_blank', 'width=640,height=480');
            window.addEventListener('message', authFn, false);
          },
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
          updater: (file: FormUploadComponent) => this.updater(file),
          parent: this,
          hideButton: true,
          hasErrors: true,
          multiple: true,
        },
      ],
    },
  ];

  constructor(
    protected ws: WebSocketService,
    protected matDialog: MatDialog,
    protected dialog: DialogService,
    private modalService: ModalService,
    private translate: TranslateService,
    private sysGeneralService: SystemGeneralService,
  ) { }

  afterInit(entityEdit: EntityFormComponent): void {
    this.entityEdit = entityEdit;
    const oauthToken = this.sysGeneralService.getTokenForJira();
    if (oauthToken) {
      this.applyToken(oauthToken);
    }
  }

  customSubmit(entityEdit: any): void {
    const payload = {
      category: entityEdit.category,
      title: entityEdit.title,
      body: entityEdit.body,
      type: entityEdit.type,
      token: entityEdit.token,
    } as CreateNewTicket;

    if (entityEdit.attach_debug) {
      payload.attach_debug = entityEdit.attach_debug;
    }

    this.openDialog(payload);
  }

  openDialog(payload: CreateNewTicket): void {
    const dialogRef = this.matDialog.open(EntityJobComponent, { data: { title: T('Ticket') }, disableClose: true });
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
              ticket: res.result.ticket,
              filename: item.file.name,
              token: payload.token,
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

  updater(file: FormUploadComponent): void {
    this.subs = [];
    const fileBrowser = file.fileInput.nativeElement;
    this.screenshot = _.find(this.fieldConfig, { name: 'screenshot' });
    this.screenshot['hasErrors'] = false;
    if (fileBrowser.files && fileBrowser.files[0]) {
      for (const browserFile of fileBrowser.files) {
        if (browserFile.size >= 52428800) {
          this.screenshot['hasErrors'] = true;
          this.screenshot['errors'] = this.translate.instant('File size is limited to 50 MiB.');
        } else {
          this.subs.push({ apiEndPoint: file.apiEndPoint, file: browserFile });
        }
      }
    }
  }

  getCategories(): void {
    const categoryField = _.find(this.fieldConfig, { name: 'category' }) as FormSelectConfig;
    categoryField.options = [];
    categoryField.isLoading = true;

    this.ws.call('support.fetch_categories', [this.token]).pipe(
      untilDestroyed(this),
    ).subscribe((choices) => {
      for (const property in choices) {
        if (choices.hasOwnProperty(property)) {
          categoryField.options.push({ label: property, value: choices[property] });
        }
        categoryField.options = _.sortBy(categoryField.options, ['label']);
      }
      categoryField.disabled = false;
      categoryField.isLoading = false;
      this.entityEdit.formGroup.get('category').enable();
    }, () => {
      categoryField.isLoading = false;
    });
  }

  doAuth(message: OauthJiraMessage): void {
    const token = message.data as string;
    this.sysGeneralService.setTokenForJira(token);
    this.applyToken(token);
  }

  applyToken(token: string): void {
    this.token = token;
    this.entityEdit.formGroup.get('token').setValue(this.token);

    const jiraButton = _.find(this.fieldConfig, { name: 'oauth-jira' }) as FormButtonConfig;
    jiraButton.customEventActionLabel = this.translate.instant('Logged in to JIRA');
    jiraButton.disabled = true;

    this.getCategories();
  }
}

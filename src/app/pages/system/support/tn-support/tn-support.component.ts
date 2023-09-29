import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import * as _ from 'lodash';
import { WebSocketService } from 'app/services/';
import { DialogService } from 'app/services/dialog.service';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { helptext_system_support as helptext } from 'app/helptext/system/support';
import { AttachDebugWarningService } from 'app/pages/system/support/services/attach-debug-warning.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tn-support',
  template: '<entity-form [conf]="this"></entity-form>',

})
export class TnSupportComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();
  entityEdit: any;
  screenshot: any;
  subs: any;
  saveSubmitText = helptext.submitBtn;
  custActions: any[] = [];
  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet[] = [
    {
      name: 'column1',
      width: '47%',
      label: false,
      config: [
        {
          type: 'paragraph',
          name: 'FN_col2',
          paraText: '<i class="material-icons">mail</i>' + helptext.contactUs,
        },
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
      name: 'middle',
      label: false,
      width: '5%',
      config: [],
    },
    {
      name: 'col2',
      width: '47%',
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
          type: 'checkbox',
          name: 'attach_debug',
          placeholder: helptext.attach_debug.placeholder,
          tooltip: helptext.attach_debug.tooltip,
          tooltipPosition: 'left',
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
          tooltipPosition: 'left',
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

  constructor(
    public dialog: MatDialog,
    public loader: AppLoaderService,
    public ws: WebSocketService,
    public dialogService: DialogService,
    public router: Router,
    private translate: TranslateService,
    private attachDebugWarningService: AttachDebugWarningService
  ) { }

  ngOnInit() {
    setTimeout(() => {
      this.translate.get(helptext.contactUs).subscribe((res) => {
        _.find(this.fieldConfig, { name: 'FN_col2' }).paraText = '<i class="material-icons">mail</i>' + res;
      });
    }, 2000);

 }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
    this.custActions = [
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
          this.router.navigate(['/system/support/eula']);
        },
      },
    ];

    this.listenForAttachDebugChanges();
  }

  emailListValidator(name: string) {
    const self = this;
    return function validEmails(control: FormControl) {
      const config = self.fieldConfig.find((c) => c.name === name);
      if (control.value) {
        let counter = 0;
        const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        if (control.value) {
          control.value.forEach((item) => {
            if (!item.match(regex)) {
              counter++;
            }
          });
        }

        const errors = control.value && control.value.length > 0 && counter > 0
          ? { validEmails: true }
          : null;

        if (errors) {
          config.hasErrors = true;
          config.errors = helptext.cc.err;
        } else {
          config.hasErrors = false;
          config.errors = '';
        }

        return errors;
      }
    };
  }

  customSubmit(entityEdit): void {
    const payload = {};
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

  openDialog(payload) {
    const dialogRef = this.dialog.open(EntityJobComponent, { data: { title: 'Ticket', CloseOnClickOutside: true } });
    let url;
    dialogRef.componentInstance.setCall('support.new_ticket', [payload]);
    dialogRef.componentInstance.submit();
    this.subscriptions.add(
      dialogRef.componentInstance.success.subscribe((res) => {
        if (res.result) {
          url = `<a href="${res.result.url}" target="_blank" style="text-decoration:underline;">${res.result.url}</a>`;
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
            this.subscriptions.add(
              dialogRef.componentInstance.success.subscribe((res) => {
                this.resetForm();
              })
            );

            this.subscriptions.add(
              dialogRef.componentInstance.failure.subscribe((res) => {
                dialogRef.componentInstance.setDescription(res.error);
              })
            );
          });
          dialogRef.componentInstance.setDescription(url);
        } else {
          dialogRef.componentInstance.setDescription(url);
          this.resetForm();
        }
      })
    );

    this.subscriptions.add(
      dialogRef.componentInstance.failure.subscribe((res) => {
        dialogRef.componentInstance.setDescription(res.error);
      })
    );
  }

  updater(file: any, parent: any) {
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

  resetForm() {
    this.entityEdit.formGroup.reset();
    this.entityEdit.formGroup.controls['TNCategory'].setValue('BUG');
    this.entityEdit.formGroup.controls['environment'].setValue('production');
    this.entityEdit.formGroup.controls['criticality'].setValue('inquiry');
    this.subs = [];
  }

  private listenForAttachDebugChanges(): void {
    const control = this.entityEdit.formGroup.controls['attach_debug'] as FormControl;

    this.subscriptions.add(
      this.attachDebugWarningService.handleAttachDebugChanges(control)
        .subscribe((checked) => control.patchValue(checked))
    );
  }
}

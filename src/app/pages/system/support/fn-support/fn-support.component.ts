import { Component, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { T } from 'app/translate-marker';
import * as _ from 'lodash';
import { EntityJobComponent } from 'app/pages//common/entity/entity-job/entity-job.component';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { WebSocketService } from 'app/services/';
import { helptext_system_support as helptext } from 'app/helptext/system/support';
import { Subscription } from 'rxjs';
import { AttachDebugWarningService } from 'app/pages/system/support/services/attach-debug-warning.service';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-fn-support',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class FnSupportComponent implements OnDestroy {
  private subscriptions = new Subscription();
  entityEdit: EntityFormComponent;
  category: any;
  screenshot: any;
  subs: any;
  saveSubmitText = helptext.submitBtn;
  isEntity = true;
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
          type: 'oauth-login',
          name: 'token',
          label: this.translate.instant('Login to Jira'),
        },
        {
          type: 'select',
          name: 'type',
          placeholder: helptext.type.placeholder,
          tooltip: helptext.type.tooltip,
          options: [
            { label: T('Bug'), value: 'BUG' },
            { label: T('Feature'), value: 'FEATURE' },
          ],
          value: 'BUG',
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
      ],
    },
    {
      name: 'middle',
      label: false,
      width: '5%',
      config: [],
    },
    {
      name: 'column2',
      width: '47%',
      label: false,
      class: 'lowerme',
      config: [
        {
          type: 'checkbox',
          name: 'attach_debug',
          placeholder: helptext.attach_debug.placeholder,
          tooltip: helptext.attach_debug.tooltip,
          tooltipPosition: 'left',
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
    protected ws: WebSocketService,
    protected dialog: MatDialog,
    protected translate: TranslateService,
    private attachDebugWarningService: AttachDebugWarningService
  ) { }

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
    setTimeout(() => {
      this.subscriptions.add(
        this.translate.get(helptext.contactUs).subscribe((res) => {
          _.find(this.fieldConfig, { name: 'FN_col2' }).paraText = '<i class="material-icons">mail</i>' + res;
        })
      );
    }, 2000);

    this.category = _.find(this.fieldConfig, { name: 'category' });
    this.loadCategoriesOnAuth();

    this.listenForAttachDebugChanges();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  customSubmit(values): void {
    const payload = {
      category: values.category,
      title: values.title,
      body: values.body,
      type: values.type,
      token: values.token,
    };
    if (values.attach_debug) {
      payload['attach_debug'] = values.attach_debug;
    }
    this.openDialog(payload);
  }

  openDialog(payload) {
    const dialogRef = this.dialog.open(EntityJobComponent, { data: { title: T('Ticket'), CloseOnClickOutside: true } });
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
              params: [{
                ticket: (res.result.ticket),
                filename: item.file.name,
                token: payload.token,
              }],
            }));
            formData.append('file', item.file, item.apiEndPoint);
            dialogRef.componentInstance.wspost(item.apiEndPoint, formData);
            this.subscriptions.add(
              dialogRef.componentInstance.success.subscribe(() => {
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

  resetForm() {
    this.entityEdit.formGroup.reset();
    this.entityEdit.formGroup.controls['type'].setValue('BUG');
    this.subs = [];
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

  private loadCategoriesOnAuth(): void {
    this.subscriptions.add(
      this.entityEdit.formGroup.controls['token'].valueChanges.subscribe((token) => {
        if (!token) {
          return;
        }

        this.category.isLoading = true;
        this.ws.call('support.fetch_categories', [token]).subscribe((res) => {
          this.category.isLoading = false;
          this.entityEdit.setDisabled('category', false);
          const options = [];
          for (const property in res) {
            if (res.hasOwnProperty(property)) {
              options.push({ label: property, value: res[property] });
            }
            this.category.options = _.sortBy(options, ['label']);
          }
        }, (error) => {
          this.entityEdit.setDisabled('category', true);
          this.category.isLoading = false;
          new EntityUtils().handleWSError(this, error, this.dialog);
        });
      })
    );
  }

  private listenForAttachDebugChanges(): void {
    const control = this.entityEdit.formGroup.controls['attach_debug'] as FormControl;

    this.subscriptions.add(
      this.attachDebugWarningService.handleAttachDebugChanges(control)
        .subscribe((checked) => control.patchValue(checked))
    );
  }
}

import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { WebSocketService } from 'app/services/';
import { DialogService } from 'app/services/dialog.service';
import { SnackbarService } from 'app/services/snackbar.service';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { helptext_system_support as helptext } from 'app/helptext/system/support';


@Component({
  selector: 'app-tn-support',
  template : `<entity-form [conf]="this"></entity-form>`,
  styleUrls: ['./tn-support.component.css']
})
export class TnSupportComponent implements OnInit {
  public entityEdit: any;
  public screenshot: any;
  public payload: any;
  public subs: any;
  public custActions: Array<any> = [];
  public fieldConfig: FieldConfig[] = []
  public fieldSets: FieldSet[] = [
    {
      name: 'column1',
      width: '50%',
      label: false,
      config:[
        {
          type: 'paragraph',
          name: 'FN_col2',
          paraText: '<i class="material-icons">mail</i>Contact Support'
        },
        {
          type : 'input',
          name : 'name',
          placeholder : helptext.name.placeholder,
          tooltip : helptext.name.tooltip,
          required: true,
          validation : helptext.name.validation
        },
        {
          type : 'input',
          name : 'email',
          placeholder : helptext.email.placeholder,
          tooltip : helptext.email.tooltip,
          required: true,
          validation : helptext.email.validation
        },
        {
          type : 'input',
          name : 'phone',
          placeholder : helptext.phone.placeholder,
          tooltip : helptext.phone.tooltip,
          required: true,
          validation : helptext.phone.validation
        },
        {
          type : 'select',
          name : 'TNCategory',
          placeholder : helptext.type.placeholder,
          tooltip : helptext.type.tooltip,
          options:[
            {label: 'Bug', value: 'BUG'},
            {label: 'Hardware', value: 'HARDWARE'},
            {label: 'Installation/Setup', value: 'INSTALL'},
            {label: 'Performance', value: 'PERFORMANCE'}
          ],
          value: 'BUG'
        },
        {
          type : 'select',
          name : 'environment',
          placeholder : helptext.environment.placeholder,
          tooltip : helptext.environment.tooltip,
          options:[
            {label: 'Production', value: 'production'},
            {label: 'Staging', value: 'staging'},
            {label: 'Testing', value: 'testing'},
            {label: 'Prototyping', value: 'prototyping'},
            {label: 'Initial Deployment/Setup', value: 'initial'}
          ],
          validation: helptext.environment.validation,
          value: 'production'
        }
      ]
    },
    {
    name: 'col2',
    width: '50%',
    label: false,
    class: 'lowerme',
    config: [
        {
          type : 'select',
          name : 'criticality',
          placeholder : helptext.criticality.placeholder,
          tooltip : helptext.criticality.tooltip,
          options:[
            {label: 'Inquiry', value: 'inquiry'},
            {label: 'Loss of Functionality', value: 'loss_functionality'},
            {label: 'Total Down', value: 'total_down'}
          ],
          validation: helptext.criticality.validation,
          value: 'inquiry'
        },
        {
          type : 'checkbox',
          name : 'attach_debug',
          placeholder : helptext.attach_debug.placeholder,
          tooltip : helptext.attach_debug.tooltip,
        },
        {
          type : 'input',
          name : 'title',
          placeholder : helptext.title.placeholder,
          tooltip : helptext.title.tooltip,
          required: true,
          validation : helptext.title.validation
        },
        {
          type : 'textarea',
          name : 'body',
          placeholder : helptext.body.placeholder,
          tooltip : helptext.body.tooltip,
          required: true,
          validation : helptext.body.validation,
          textAreaRows: 8
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
          multiple: true
        }
      ]
    }
  ]

  constructor(public dialog: MatDialog, public loader: AppLoaderService,
    public ws: WebSocketService, public snackbar: SnackbarService,
    public dialogService: DialogService, public router: Router) { }

  ngOnInit() {
  }

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
    this.custActions = [
      {
        id : 'update_license',
        name : helptext.update_license.open_dialog_button,
        function : () => {
          const localLoader = this.loader;
          const localWS = this.ws;
          const localSnackbar = this.snackbar;
          const localDialogService = this.dialogService;

          const licenseForm: DialogFormConfiguration = {
            title: helptext.update_license.dialog_title,
            fieldConfig: [
              {
                type: 'textarea',
                name: 'license',
                placeholder: helptext.update_license.license_placeholder
              }
            ],
            saveButtonText: helptext.update_license.save_button,
            customSubmit: function (entityDialog) {
              const value = entityDialog.formValue.license;
              localLoader.open();
              localWS.call('system.license_update', [value]).subscribe((res) => {
                entityDialog.dialogRef.close(true);
                localLoader.close();
                localSnackbar.open(helptext.update_license.success_message,
                  helptext.update_license.snackbar_action, { duration: 5000 });
              },
              (err) => {
                localLoader.close();
                entityDialog.dialogRef.close(true);
                localDialogService.errorReport((helptext.update_license.error_dialog_title), err.reason, err.trace.formatted);
              });
            }

          }
          this.dialogService.dialogForm(licenseForm);
        }
      },{
        id : 'userguide',
        name: helptext.update_license.user_guide_button,
        function : () => {
          // TODO: Need updated address before release
          window.open('https://www.ixsystems.com/blog/knowledgebase_category/truenas/')
        }
      },
      {
        id : 'eula',
        name: helptext.update_license.eula_button,
        function : () => {
          this.router.navigate(['/system/support/eula'])
        }
      }
    ]
  }

  customSubmit(entityEdit): void{
    this.payload['name'] = entityEdit.name;
    this.payload['email'] = entityEdit.email;
    this.payload['phone'] = entityEdit.phone;
    this.payload['category'] = entityEdit.TNCategory;
    this.payload['environment'] = entityEdit.environment;
    this.payload['criticality'] = entityEdit.criticality;
    this.payload['attach_debug'] = entityEdit.attach_debug;
    this.payload['title'] = entityEdit.title;
    this.payload['body'] = entityEdit.body;
    this.openDialog();
  };

  openDialog() {
    const dialogRef = this.dialog.open(EntityJobComponent, {data: {"title":"Ticket","CloseOnClickOutside":true}});
    let url;
    dialogRef.componentInstance.setCall('support.new_ticket', [this.payload]);
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.subscribe(res=>{
      if (res.result) {
        url = `<a href="${res.result.url}" target="_blank" style="text-decoration:underline;">${res.result.url}</a>`;
      }
      if (res.method === 'support.new_ticket' && this.subs && this.subs.length > 0) {
        this.subs.forEach((item) => {
          const formData: FormData = new FormData();
            formData.append('data', JSON.stringify({
              "method": "support.attach_ticket",
              "params": [{'ticket': (res.result.ticket), 'filename': item.file.name, 'username': this.payload['username'], 'password': this.payload['password'] }]
            }));
            formData.append('data', JSON.stringify({
              "method": "support.attach_ticket",
              "params": [{'ticket': (res.result.ticket), 'filename': item.file.name }]
            }));

          formData.append('file', item.file, item.apiEndPoint);
          dialogRef.componentInstance.wspost(item.apiEndPoint, formData);
          dialogRef.componentInstance.success.subscribe(res=>{
            this.resetForm();
          }),
          dialogRef.componentInstance.failure.subscribe((res) => {
            dialogRef.componentInstance.setDescription(res.error);
          });
        });
        dialogRef.componentInstance.setDescription(url);
      } else {
        dialogRef.componentInstance.setDescription(url);
        this.resetForm();
      }
    })
    dialogRef.componentInstance.failure.subscribe((res) => {
      dialogRef.componentInstance.setDescription(res.error);
    });
  }

  updater(file: any, parent: any){
    parent.subs = [];
    const fileBrowser = file.fileInput.nativeElement;
    this.screenshot = _.find(parent.fieldConfig, { name: 'screenshot' });
    this.screenshot['hasErrors'] = false;
    if (fileBrowser.files && fileBrowser.files[0]) {
      for (let i = 0; i < fileBrowser.files.length; i++) {
        if (fileBrowser.files[i].size >= 52428800) {
          this.screenshot['hasErrors'] = true;
          this.screenshot['errors'] = 'File size is limited to 50 MiB.';
        }
        else {
          parent.subs.push({"apiEndPoint":file.apiEndPoint, "file": fileBrowser.files[i]});
        }
      }
    }
  }

  resetForm () {
    this.entityEdit.formGroup.reset();
    this.entityEdit.formGroup.controls['TNCategory'].setValue('BUG');
    this.entityEdit.formGroup.controls['environment'].setValue('production');
    this.entityEdit.formGroup.controls['criticality'].setValue('inquiry');
  };
}

import { ApplicationRef, Component, Injector } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { RestService, WebSocketService } from '../../../services/';
import { DialogService } from '../../../services/dialog.service';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import { helptext_system_support as helptext } from 'app/helptext/system/support';
import { DialogFormConfiguration } from '../../common/entity/entity-dialog/dialog-form-configuration.interface';
import { SnackbarService } from '../../../services/snackbar.service';


@Component({
  selector : 'app-support',
  template : `
  <entity-form [conf]="this"></entity-form>
  `,
  providers: [SnackbarService]
})
export class SupportComponent {
  public username: any;
  public password: any;
  public categories: any;
  public attach_debug: any;
  public title: any;
  public body: any;
  public type: any;
  public category: any;
  public payload = {};
  public entityEdit: any;
  public saveSubmitText = "Submit";
  public password_fc: any;
  public username_fc: any;
  public is_freenas: boolean;
  public product_image = '';
  public scrshot: any;
  public subs: any;
  public fieldConfig: FieldConfig[] = []
  public fieldSets: FieldSet[] = [
    {
      name: 'Column 1',
      label: false,
      width: '25%',
      config:[
        {
          type: 'paragraph',
          name: 'FN_col1',
          paraText: '<i class="material-icons">info</i>System Information'
        },
        {
          type: 'paragraph',
          name: 'TN_col1',
          paraText: '<i class="material-icons">info</i>License Information'
        },
        {
          type: 'paragraph',
          name: 'TN_custname',
          paraText: '<h4>Customer Name: </h4>'
        },
        {
          type: 'paragraph',
          name: 'FN_version',
          paraText: '<h4>OS Version: </h4>'
        },
        {
          type: 'paragraph',
          name: 'TN_features',
          paraText: '<h4>Features: </h4>'
        },
        {
          type: 'paragraph',
          name: 'TN_contracttype',
          paraText: '<h4>Contract Type: </h4>'
        },
        {
          type: 'paragraph',
          name: 'TN_contractdate',
          paraText: '<h4>Expiration Date: </h4>'
        },
        {
          type: 'paragraph',
          name: 'FN_model',
          paraText: '<h4>Model: </h4>'
        },
        {
          type: 'paragraph',
          name: 'FN_memory',
          paraText: '<h4>Memory: </h4>'
        },
        {
          type: 'paragraph',
          name: 'FN_sysserial',
          paraText: '<h4>Serial Number: </h4>'
        },
        {
          type: 'paragraph',
          name: 'support_text',
          paraText: 
            'Search the <a href="https://jira.ixsystems.com/projects/NAS/issues/" \
              target="_blank">FreeNAS issue tracker</a> \
              to ensure the issue has not already been reported before \
              filing a bug report or feature request. If an issue has \
              already been created, add a comment to the existing issue. \
              Please visit the <a href="http://www.ixsystems.com/storage/" target="_blank"> \
              iXsystems storage page</a> \
              for enterprise-grade storage solutions and support.'
        }
      ]
    },
    {
      name: 'Column 2',
      label: false,
      width: '25%',
      class: 'lowerme',
      config: [
        {
          type: 'paragraph',
          name: 'TN_model',
          paraText: '<h4>Model: </h4>'
        },

        {
          type: 'paragraph',
          name: 'TN_sysserial',
          paraText: '<h4>System Serial: </h4>'
        },
        {
          type: 'paragraph',
          name: 'TN_addhardware',
          paraText: '<h4>Additional Hardware: </h4>'
        }
      ]
    },
    {
      name: 'Column 3',
      label: false,
      width: '50%',
      config:[
        {
          type: 'paragraph',
          name: 'pic',
          paraText: ''
        },
      ]
    },
    {
      name: 'divider',
      divider: true
    }, 
    {
      name: 'Column 4',
      label: false,
      width: '100%',
      config:[
        {
          type: 'paragraph',
          name: 'TN_proactive_section_title',
          paraText: '<i class="material-icons">swap_horiz</i>Proactive Support',
          disabled: true
        },
        {
          type: 'paragraph',
          name: 'TN_proactive_instructions',
          paraText: helptext.proactive.instructions
        },
      ]
    },
    {
      name: 'Column 5',
      label: false,
      width: '50%',
      config:[
        {
          type: 'paragraph',
          name: 'TN_proactive_title',
          paraText: 'Primary Contact'
        },
        {
          type: 'input',
          name: 'TN_proactive_primary_name',
          placeholder : 'Name',
          required: true,
          validation : helptext.username.validation,
        },
        {
          type: 'input',
          name: 'TN_proactive_primary_title',
          placeholder : 'Title',
          required: true,
          validation : helptext.username.validation,
        },
        {
          type: 'input',
          name: 'TN_proactive_primary_email',
          placeholder : 'Email',
          required: true,
          validation : helptext.username.validation,
        },
        {
          type: 'input',
          name: 'TN_proactive_primary_phone',
          placeholder : 'Phone Number',
          required: true,
          validation : helptext.username.validation,
        },
      ]
    },
    {
      name: 'Column 6',
      label: false,
      width: '50%',
      config:[
        {
          type: 'paragraph',
          name: 'TN_proactive_second_title',
          paraText: 'Secondary Contact'
        },
        {
          type: 'input',
          name: 'TN_proactive_secondary_name',
          placeholder : 'Name'
        },
        {
          type: 'input',
          name: 'TN_proactive_secondary_title',
          placeholder : 'Title'
        },
        {
          type: 'input',
          name: 'TN_proactive_secondary_email',
          placeholder : 'Email'
        },
        {
          type: 'input',
          name: 'TN_proactive_secondary_phone',
          placeholder : 'Phone Number'
        }
      ]
    },
    {
      name: 'Column 7',
      label: false,
      width: '100%',
      config:[
        {
          type: 'checkbox',
          name: 'TN_proactive_checkbox',
          placeholder: 'Enable iXsystems Proactive Support'
        }
      ]
    },
    {
      name: 'TN_proactive_divider',
      divider: true
    },
    {
      name: 'Column 8',
      width: '50%',
      label: false,
      config:[
        {
          type: 'paragraph',
          name: 'FN_col2',
          paraText: '<i class="material-icons">mail</i>Contact Support'
        },
        {
          type: 'paragraph',
          name: 'FN_jira-info',
          paraText: '<a href="https://jira.ixsystems.com/secure/Signup!default.jspa" target="_blank">\
          Create a Jira account</a> to file an issue. Use a valid \
          email address when registering to receive issue status updates.'
        },
        {
          type : 'input',
          name : 'username',
          placeholder : helptext.username.placeholder,
          tooltip : helptext.username.tooltip,
          required: true,
          validation : helptext.username.validation,
          blurStatus : true,
          blurEvent : this.blurEvent,
          parent : this,
          value: '',
        },
        {
          type : 'input',
          name : 'password',
          inputType : 'password',
          placeholder : helptext.password.placeholder,
          tooltip : helptext.password.tooltip,
          required: true,
          validation : helptext.password.validation,
          blurStatus : true,
          blurEvent : this.blurEvent,
          parent : this,
          togglePw : true,
          value: '',
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
          name : 'type',
          placeholder : helptext.type.placeholder,
          tooltip : helptext.type.tooltip,
          options:[
            {label: 'Bug', value: 'BUG'},
            {label: 'Feature', value: 'FEATURE'}
          ]
        },
        {
          type : 'select',
          name : 'category',
          placeholder : helptext.category.placeholder,
          tooltip : helptext.category.tooltip,
          required: true,
          validation : helptext.category.validation,
          options:[],
          disabled: true,
          isLoading: false
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
    name: 'Column 9',
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

  private freeNASFields: Array<any> = [
    'FN_col1',
    'FN_jira-info',
    'FN_version',
    'FN_model',
    'FN_memory',
    'FN_sysserial',
    'support_text',
    'username',
    'password',
    'category',
    'type'
  ];

  private trueNASFields: Array<any> = [
    'TN_col1',
    'TN_model',
    'TN_custname',
    'TN_sysserial',
    'TN_features',
    'TN_contracttype',
    'TN_contractdate',
    'TN_addhardware',
    'name',
    'email',
    'phone',
    'TNCategory',
    'environment',
    'criticality',
    'TN_proactive_section_title',
    'TN_proactive_instructions',
    'TN_proactive_title',
    'TN_proactive_primary_name',
    'TN_proactive_primary_title',
    'TN_proactive_primary_email',
    'TN_proactive_primary_phone',
    'TN_proactive_second_title',
    'TN_proactive_secondary_name',
    'TN_proactive_secondary_title',
    'TN_proactive_secondary_email',
    'TN_proactive_secondary_phone',
    'TN_proactive_checkbox',
    // 'TN_proactive_divider'
  ];

  public custActions: Array<any> = [];

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService, protected _injector: Injector,
              protected _appRef: ApplicationRef, protected dialog: MatDialog,
              protected dialogService: DialogService,
              public loader: AppLoaderService, private snackbar: SnackbarService)
              {}

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
    this.category = _.find(this.fieldConfig, {name: "category"});
    if (window.localStorage['is_freenas'] === 'true') {
      this.is_freenas = true;
    };
    if (this.is_freenas) {
      for (let i in this.trueNASFields) {
        this.hideField(this.trueNASFields[i], true, entityEdit);
      }
      this.product_image = 'freenas_mini_cropped.png';
      this.ws.call('system.info').subscribe((res) => {
        this.getFreeNASImage(res.system_product)
        _.find(this.fieldConfig, {name : "FN_version"}).paraText += res.version;
        _.find(this.fieldConfig, {name : "FN_model"}).paraText += res.system_product;
        _.find(this.fieldConfig, {name : "FN_memory"}).paraText += Number(res.physmem / 1024 / 1024 / 1024).toFixed(0) + ' GiB';
        _.find(this.fieldConfig, {name : "FN_sysserial"}).paraText ? 
          _.find(this.fieldConfig, {name : "FN_sysserial"}).paraText += res.system_serial :
          _.find(this.fieldConfig, {name : "FN_sysserial"}).paraText = '';
        _.find(this.fieldConfig, {name : "pic"}).paraText = `<img src="assets/images/${this.product_image}" height="350">`;
      })
    } else {
      for (let i in this.freeNASFields) {
        this.hideField(this.freeNASFields[i], true, entityEdit);
      }  
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
      this.ws.call('system.info').subscribe((res) => {
        let now = new Date();
        let then = new Date(res.license.contract_end.$value);
        let daysLeft = this.daysTillExpiration(now, then);
        this.getTrueNASImage(res.system_product)
        _.find(this.fieldConfig, {name : "pic"}).paraText = `<img src="assets/images/${this.product_image}">`;
        _.find(this.fieldConfig, {name : "TN_model"}).paraText += res.system_product;
        _.find(this.fieldConfig, {name : "TN_custname"}).paraText += res.license.customer_name || '---';

        res.license.system_serial_ha ?
          _.find(this.fieldConfig, {name : "TN_sysserial"}).paraText += res.license.system_serial + ' / ' + res.license.system_serial_ha :
          _.find(this.fieldConfig, {name : "TN_sysserial"}).paraText += res.license.system_serial;          
        
        let featureList;
        res.license.features.length === 0 ? featureList = 'NONE' : featureList = res.license.features.join(', ');
        _.find(this.fieldConfig, {name : "TN_features"}).paraText += featureList;

        _.find(this.fieldConfig, {name : "TN_contracttype"}).paraText += res.license.contract_type;
        _.find(this.fieldConfig, {name : "TN_contractdate"}).paraText += res.license.contract_end.$value + ` (expires in ${daysLeft} days)` || '';

        let addhw;
        res.license.addhw.length === 0 ? addhw = 'NONE' : addhw = res.license.addhw.join(', ');
        _.find(this.fieldConfig, {name : "TN_addhardware"}).paraText += addhw; 
      })
    }
  }

  getTrueNASImage(sys_product) {
    if (sys_product.includes('X10')) {
      this.product_image = '/servers/X10.png';
    } else if (sys_product.includes('X20')) {
      this.product_image = '/servers/X20.png';
    } else if (sys_product.includes('M40')) {
      this.product_image = '/servers/M40.png';
    }  else if (sys_product.includes('M50')) {
      this.product_image = '/servers/M50.png';
    } else if (sys_product.includes('Z20')) {
      this.product_image = '/servers/Z20.png';
    } else if (sys_product.includes('M50')) {
      this.product_image = '/servers/M50.png';
    } else if (sys_product.includes('Z35')) {
      this.product_image = '/servers/Z35.png';
    } else if (sys_product.includes('Z50')) {
      this.product_image = '/servers/Z50.png';
    }
    else {
      this.product_image = 'ix-original.svg';
    }
  }

  getFreeNASImage(sys_product) {
    switch(sys_product){
      case "FREENAS-MINI-2.0":
        this.product_image = 'freenas_mini_cropped.png';
      break;
      case "FREENAS-MINI-XL":
        this.product_image = 'freenas_mini_xl_cropped.png';
      break;
      default:
        this.product_image = 'ix-original.svg';
      break;
    }
  }

  daysTillExpiration(now, then) {
    let oneDay = 24*60*60*1000; // milliseconds in a day
    return Math.round(Math.abs((now.getTime() - then.getTime())/(oneDay)));
  }

  customSubmit(entityEdit): void{
    if (this.is_freenas) {
      this.payload['username'] = entityEdit.username;
      this.payload['password'] = entityEdit.password;
      this.payload['category'] = entityEdit.category;
      this.payload['attach_debug'] = entityEdit.attach_debug;
      this.payload['title'] = entityEdit.title;
      this.payload['body'] = entityEdit.body;
      this.payload['type'] = entityEdit.type;
    } else {
      this.payload['name'] = entityEdit.name;
      this.payload['email'] = entityEdit.email;
      this.payload['phone'] = entityEdit.phone;
      this.payload['category'] = entityEdit.TNCategory;
      this.payload['environment'] = entityEdit.environment;
      this.payload['criticality'] = entityEdit.criticality;
      this.payload['attach_debug'] = entityEdit.attach_debug;
      this.payload['title'] = entityEdit.title;
      this.payload['body'] = entityEdit.body;
    }
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
          if (this.is_freenas) {
            formData.append('data', JSON.stringify({
              "method": "support.attach_ticket",
              "params": [{'ticket': (res.result.ticket), 'filename': item.file.name, 'username': this.payload['username'], 'password': this.payload['password'] }]
            }));
          } else { // TrueNAS support form doesn't ask for sign-in creds
            formData.append('data', JSON.stringify({
              "method": "support.attach_ticket",
              "params": [{'ticket': (res.result.ticket), 'filename': item.file.name }]
            }));
          }
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
        this.resetForm();
      } else {
        dialogRef.componentInstance.setDescription(url);
        this.resetForm();
      }
    })
    dialogRef.componentInstance.failure.subscribe((res) => {
      dialogRef.componentInstance.setDescription(res.error);
    });
  }

  resetForm () {
    this.entityEdit.formGroup.reset();
    if (!this.is_freenas) {
      this.entityEdit.formGroup.controls['TNCategory'].setValue('BUG');
      this.entityEdit.formGroup.controls['environment'].setValue('production');
      this.entityEdit.formGroup.controls['criticality'].setValue('inquiry');
    }
  };

  blurEvent(parent){
    this.category = _.find(parent.fieldConfig, {name: "category"});
    this.password_fc = _.find(parent.fieldConfig, { name: 'password' });
    this.username_fc = _.find(parent.fieldConfig, { name: 'username' });
      if(parent.entityEdit){
        this.username  = parent.entityEdit.formGroup.controls['username'].value;
        this.password  = parent.entityEdit.formGroup.controls['password'].value;
        this.password_fc['hasErrors'] = false;
        this.password_fc['errors'] = '';
        this.username_fc['hasErrors'] = false;
        this.username_fc['errors'] = '';

        if(this.category.options.length > 0){
          this.category.options = [];
        }
        if(this.category.options.length === 0 && this.username !== '' && this.password !== ''){
          this.category.isLoading = true;
          parent.ws.call('support.fetch_categories',[this.username,this.password]).subscribe((res)=>{
            this.category.isLoading = false;
            parent.entityEdit.setDisabled('category', false);
            for (const property in res) {
              if (res.hasOwnProperty(property)) {
                this.category.options.push({label : property, value : res[property]});
              }
            }},(error)=>{
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

  updater(file: any, parent: any){
    parent.subs = [];
    const fileBrowser = file.fileInput.nativeElement;
    this.scrshot = _.find(parent.fieldConfig, { name: 'screenshot' });
    this.scrshot['hasErrors'] = false;
    if (fileBrowser.files && fileBrowser.files[0]) {
      for (let i = 0; i < fileBrowser.files.length; i++) {
        if (fileBrowser.files[i].size >= 52428800) {
          this.scrshot['hasErrors'] = true;
          this.scrshot['errors'] = 'File size is limited to 50 MiB.';
        } 
        else {
          parent.subs.push({"apiEndPoint":file.apiEndPoint, "file": fileBrowser.files[i]});
        }
      }
    }
  }

  hideField(fieldName: any, show: boolean, entity: any) {
    let target = _.find(this.fieldConfig, {'name' : fieldName});
    target['isHidden'] = show;
    entity.setDisabled(fieldName, show, show);
  }

}

import { ApplicationRef, Component, Injector } from '@angular/core';
import { MatDialog } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { RestService, WebSocketService } from '../../../services/';
import { DialogService } from '../../../services/dialog.service';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import { helptext_system_support as helptext } from 'app/helptext/system/support';


@Component({
  selector : 'app-support',
  template : `
  <entity-form [conf]="this"></entity-form>
  `
})
export class SupportComponent  {
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
  public is_freenas: Boolean = window.localStorage['is_freenas'];
  public model = 'Test Model';
  public fieldConfig: FieldConfig[] = []
  public fieldSets: FieldSet[] = [
    {
      name: 'Column 1',
      label: false,
      width: '50%',
      config:[
        {
          type: 'paragraph',
          name: 'FN_col1',
          paraText: 'System Information'
        },
        {
          type: 'paragraph',
          name: 'TN_col1',
          paraText: 'License Information'
        },
        {
          type: 'paragraph',
          name: 'support_text',
          paraText: this.sanitizer.bypassSecurityTrustHtml(
            'Search the <a href="https://jira.ixsystems.com/projects/NAS/issues/" \
              target="_blank" style="text-decoration:underline;">FreeNAS issue tracker</a> \
              to ensure the issue has not already been reported before \
              filing a bug report or feature request. If an issue has \
              already been created, add a comment to the existing issue. \
              Please visit the <a href="http://www.ixsystems.com/storage/" target="_blank" \
              style="text-decoration:underline;">iXsystems storage page</a> \
              for enterprise-grade storage solutions and support.<br><br> \
              <a href="https://jira.ixsystems.com/secure/Signup!default.jspa" target="_blank" \
              style="text-decoration:underline;">Create a Jira account</a> to file an issue. Use a valid \
              email address when registering to receive issue status updates.')
        },
        {
          type: 'paragraph',
          name: 'TN_model',
          paraText: '<h4>Model: </h4>' + this.model
        },
        {
          type: 'paragraph',
          name: 'TN_custname',
          paraText: '<h4>Customer Name: </h4>' + this.model
        },
        {
          type: 'paragraph',
          name: 'TN_sysserial',
          paraText: '<h4>System Serial: </h4>' + this.model
        },
        {
          type: 'paragraph',
          name: 'TN_features',
          paraText: '<h4>Features: </h4>' + this.model
        },
        {
          type: 'paragraph',
          name: 'TN_contracttype',
          paraText: '<h4>Contract Type: </h4>' + this.model
        },
        {
          type: 'paragraph',
          name: 'TN_contractdate',
          paraText: '<h4>Contract Date: </h4>' + this.model
        },
        {
          type: 'paragraph',
          name: 'TN_addhardware',
          paraText: '<h4>Additional Hardware: </h4>' + this.model
        },
      ]
    },

    {
      name: 'Column 2',
      width: '50%',
      label: false,
      config:[
        {
          type: 'paragraph',
          name: 'FN_col2',
          paraText: 'Customer Information'
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
          togglePw : true,
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
          name : 'environment',
          placeholder : helptext.environment.placeholder,
          tooltip : helptext.environment.tooltip,
          options:[
            {label: 'Production', value: 'production'},
            {label: 'Staging', value: 'staging'},
            {label: 'Testing', value: 'testing'},
            {label: 'Prototyping', value: 'prototyping'},
            {label: 'Initial Deployment/Setup', value: 'initial'}
          ]
        },
        {
          type : 'select',
          name : 'criticality',
          placeholder : helptext.criticality.placeholder,
          tooltip : helptext.criticality.tooltip,
          options:[
            {label: 'Inquiry', value: 'inquiry'},
            {label: 'Loss of Functionality', value: 'loss_functionality'},
            {label: 'Total Down', value: 'total_down'}
          ]
        },
        {
          type : 'select',
          name : 'category',
          placeholder : helptext.category.placeholder,
          tooltip : helptext.category.tooltip,
          required: true,
          validation : helptext.category.validation,
          options:[]
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
          validation : helptext.body.validation
        }
      ]
    }
  ]

  private freeNASFields: Array<any> = [
    'FN_col1',
    'support_text',
    'username',
    'password',
    'category'
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
    'environment',
    'criticality'
  ];

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService, protected _injector: Injector,
              protected _appRef: ApplicationRef, protected dialog: MatDialog,
              private sanitizer: DomSanitizer, protected dialogService: DialogService)
              {}

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
    this.category = _.find(this.fieldConfig, {name: "category"});

    if (this.is_freenas) {
      for (let i in this.trueNASFields) {
        console.log(this.trueNASFields[i])
        this.hideField(this.trueNASFields[i], true, entityEdit);
      }
    } else {
      for (let i in this.freeNASFields) {
        this.hideField(this.freeNASFields[i], true, entityEdit);
      }      
    }
  }

  customSubmit(entityEdit): void{
    this.payload['username'] = entityEdit.username;
    this.payload['password'] = entityEdit.password;
    this.payload['category'] = entityEdit.category;
    this.payload['attach_debug'] = entityEdit.attach_debug;
    this.payload['title'] = entityEdit.title;
    this.payload['body'] = entityEdit.body;
    this.payload['type'] = entityEdit.type;

    this.openDialog();
  };

  openDialog() {
    const dialogRef = this.dialog.open(EntityJobComponent, {data: {"title":"Ticket","CloseOnClickOutside":true}});
    dialogRef.componentInstance.setCall('support.new_ticket', [this.payload]);
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.subscribe(res=>{
      const url = `<a href="${res.result.url}" target="_blank" style="text-decoration:underline;">${res.result.url}</a>`;
      dialogRef.componentInstance.setDescription(url);
    }),
    dialogRef.componentInstance.failure.subscribe((res) => {
      dialogRef.componentInstance.setDescription(res.error);
    });
  }


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
          parent.ws.call('support.fetch_categories',[this.username,this.password]).subscribe((res)=>{
            for (const property in res) {
              if (res.hasOwnProperty(property)) {
                this.category.options.push({label : property, value : res[property]});
              }
            }},(error)=>{
              this.password_fc['hasErrors'] = true;
              this.password_fc['errors'] = 'Incorrect Username/Password.';
            });
        }
      }
  }

  hideField(fieldName: any, show: boolean, entity: any) {
    let target = _.find(this.fieldConfig, {'name' : fieldName});
    target['isHidden'] = show;
    entity.setDisabled(fieldName, show, show);
  }

}

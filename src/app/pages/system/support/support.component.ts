import { ApplicationRef, Component, Injector } from '@angular/core';
import { MatDialog } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { RestService, WebSocketService } from '../../../services/';
import { DialogService } from '../../../services/dialog.service';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
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
  public registerUrl = " https://redmine.ixsystems.com/account/register"
  public password_fc: any;
  public username_fc: any;


  public fieldConfig: FieldConfig[] = [
    {
      type: 'paragraph',
      name: 'support_text',
      paraText: this.sanitizer.bypassSecurityTrustHtml(
        'Search the <a href="https://redmine.ixsystems.com/projects/freenas" \
         target="_blank" style="text-decoration:underline;">FreeNAS issue tracker</a> \
         to ensure the issue has not already been reported before \
         filing a bug report or feature request. If an issue has \
         already been created, add a comment to the existing issue. \
         Please visit the <a href="http://www.ixsystems.com/storage/" target="_blank" \
         style="text-decoration:underline;">iXsystems storage page</a> \
         for enterprise-grade storage solutions and support.<br><br> \
         <a href="https://redmine.ixsystems.com/account/register" target="_blank" \
         style="text-decoration:underline;">Create a Redmine account</a> to file an issue. Use a valid \
         email address when registering to receive issue status updates.')
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
      type : 'select',
      name : 'type',
      placeholder : helptext.type.placeholder,
      tooltip : helptext.type.tooltip,
      options:[
        {label: 'bug', value: 'BUG'},
        {label: 'feature', value: 'FEATURE'}
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
    },
  ];
  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService, protected _injector: Injector,
              protected _appRef: ApplicationRef, protected dialog: MatDialog,
              private sanitizer: DomSanitizer, protected dialogService: DialogService)
              {}

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
    this.category = _.find(this.fieldConfig, {name: "category"});



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

}

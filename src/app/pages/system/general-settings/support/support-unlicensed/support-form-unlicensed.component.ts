import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { T } from "app/translate-marker";
import * as _ from 'lodash';
import { EntityJobComponent } from 'app/pages//common/entity/entity-job/entity-job.component';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { WebSocketService } from 'app/services/';
import { ModalService } from '../../../../../services/modal.service';
import { helptext_system_support as helptext } from 'app/helptext/system/support';

@Component({
  selector: 'app-support-form-unlicensed',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class SupportFormUnlicensedComponent {
  public entityEdit: any;
  public password: any;
  public username: any;
  public category: any;
  public screenshot: any;
  public password_fc: any;
  public username_fc: any;
  public subs: any;
  public saveSubmitText = helptext.submitBtn;
  public isEntity = true;
  public title = helptext.ticket;
  protected isOneColumnForm = true;

  public fieldConfig: FieldConfig[] = []
  public fieldSets: FieldSet[] = [
    {
      name: 'column1',
      label: false,
      config:[
        {
          type: 'paragraph',
          name: 'FN_jira-info',
          paraText: helptext.FN_Jira_message
        },
        {
          type : 'input',
          name : 'username',
          placeholder : helptext.username.placeholder,
          tooltip :helptext.username.tooltip,
          tooltipPosition: 'below',
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
          tooltipPosition: 'above',
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
          tooltipPosition: 'above',
          options:[
            {label: T('Bug'), value: 'BUG'},
            {label: T('Feature'), value: 'FEATURE'}
          ],
          value: 'BUG'
        },
        {
          type : 'select',
          name : 'category',
          placeholder : helptext.category.placeholder,
          tooltip : helptext.category.tooltip,
          tooltipPosition: 'above',
          required: true,
          validation : helptext.category.validation,
          options:[],
          disabled: true,
          isLoading: false
        },
        {
          type : 'checkbox',
          name : 'attach_debug',
          placeholder : helptext.attach_debug.placeholder,
          tooltip : helptext.attach_debug.tooltip,
          tooltipPosition: 'above',
          value: false
        },
        {
          type : 'input',
          name : 'title',
          placeholder : helptext.title.placeholder,
          tooltip : helptext.title.tooltip,
          tooltipPosition: 'above',
          required: true,
          validation : helptext.title.validation
        },
        {
          type : 'textarea',
          name : 'body',
          placeholder : helptext.body.placeholder,
          tooltip : helptext.body.tooltip,
          tooltipPosition: 'above',
          required: true,
          validation : helptext.body.validation,
          textAreaRows: 8
        },
        {
          type: 'upload',
          name: 'screenshot',
          placeholder: helptext.screenshot.placeholder,
          tooltip: helptext.screenshot.tooltip,
          tooltipPosition: 'above',
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

  constructor(protected ws: WebSocketService,  protected dialog: MatDialog,
    private modalService: ModalService) { }

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
  }

  blurEvent(parent){
    this.password_fc = _.find(parent.fieldConfig, { name: 'password' });
    this.username_fc = _.find(parent.fieldConfig, { name: 'username' });
    this.category = _.find(parent.fieldConfig, {name: "category"});
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
            let options = [];
            for (const property in res) {
              if (res.hasOwnProperty(property)) {
                options.push({label : property, value : res[property]});
              }
              this.category.options = _.sortBy(options, ['label']);
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

  customSubmit(entityEdit): void {
    let payload = {};
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
  };

  openDialog(payload) {
    const dialogRef = this.dialog.open(EntityJobComponent, {data: {"title":T("Ticket"),"CloseOnClickOutside":true}});
    let url;
    dialogRef.componentInstance.setCall('support.new_ticket', [payload]);
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
            "params": [{'ticket': (res.result.ticket), 'filename': item.file.name, 'username': payload['username'], 'password': payload['password'] }]
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

  resetForm () {
    this.entityEdit.formGroup.reset();
    this.entityEdit.formGroup.controls['type'].setValue('BUG');
    this.subs = [];
    this.modalService.close('slide-in-form');
  };


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
  };
}

import { ApplicationRef, Component, OnInit, Injector, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

import { RestService, UserService, WebSocketService } from '../../../services/';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { FileUploader } from 'ng2-file-upload';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import { MatDialog, MatDialogRef } from '@angular/material';

@Component({
  selector : 'app-support',
  templateUrl : './support.component.html',
  styleUrls : [ './support.component.css' ],
})

export class SupportComponent {
  username: any;
  password: any;
  categories: any;
  attach_debug: any;
  title: any;
  body: any;
  type: any;
  category: any;
  payload = {};
  busy: Subscription;

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService, protected _injector: Injector,
              protected _appRef: ApplicationRef, protected dialog: MatDialog)
              {
              }
  
  onSubmit(): void{
    this.payload['username'] = this.username;
    this.payload['password'] = this.password;
    this.payload['category'] = this.category;
    this.payload['attach_debug'] = this.attach_debug;
    this.payload['title'] = this.title;
    this.payload['body'] = this.body;
    this.payload['type'] = this.type;

    this.openDialog();
  };

  openDialog() {
    let dialogRef = this.dialog.open(EntityJobComponent, {data: {"title":"Update"}});
    dialogRef.componentInstance.setCall('support.new_ticket', [this.payload]);
    dialogRef.componentInstance.submit();
  }

  onBlurMethod(){
    if (this.username !== '' && this.password !== '') {
      this.ws.call('support.fetch_categories',[this.username,this.password]).subscribe((res) => {
        this.categories = [];
        for (let property in res) {
          if (res.hasOwnProperty(property)) {
            this.categories.push({label : property, value : res[property]});
          }
        }
      });
    } else {
      console.log("please enter valid email address");
    }
  }

}

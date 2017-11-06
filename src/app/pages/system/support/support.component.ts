import {ApplicationRef, Component, Injector} from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { RestService, WebSocketService } from '../../../services/';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import {MdDialog, MdSnackBar} from '@angular/material';
import {Http, Response} from "@angular/http";

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
  attachment: File;
  payload = {};
  busy: Subscription;
  isAttachmentValid: boolean = true;
  isDebugValid: boolean = true;

  constructor(protected router: Router, protected rest: RestService,
              protected http: Http, protected snackBar: MdSnackBar,
              protected ws: WebSocketService, protected _injector: Injector,
              protected _appRef: ApplicationRef, protected dialog: MdDialog)
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
    this.payload['attachment'] = this.attachment;

    if(this.attach_debug) {
      this.checkDebugFileValid();
    } else {
      this.openDialog();
    }
  };

  checkDebugFileValid() {
    const obs1 = this.rest.post('/api/v1.0/system/debug/', {}, false);
    obs1.subscribe((res: any) => {
      const url = res.data.url.toString(), xhr: XMLHttpRequest = new XMLHttpRequest();
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            const fileSize = xhr.getResponseHeader('content-length');
            this.isDebugValid = Number(fileSize) < 20000000;
            if(this.isDebugValid) this.openDialog();
          }
        }
      };
      xhr.open('HEAD', url, true);
      xhr.send();
    })
  }

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


  selectFile(event: any) {
    const fileList: File[] = event.target.files;
    this.attachment = fileList[0];
    this.isAttachmentValid = this.attachment.size < 20000000;
  }
}

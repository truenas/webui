import {ApplicationRef, Component, OnInit, Injector, ViewChild} from '@angular/core';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';

import {GlobalState} from '../../../global.state';
import {RestService, UserService, WebSocketService} from '../../../services/';
import {EntityConfigComponent} from '../../common/entity/entity-config/';
import {FieldConfig
} from '../../common/entity/entity-form/models/field-config.interface';
import { FileUploader } from 'ng2-file-upload';
import {BaJob} from '../../../theme/components';

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
  @ViewChild(BaJob) baJob: BaJob;
  busy: Subscription;
  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService, protected _injector: Injector,
              protected _appRef: ApplicationRef, protected _state: GlobalState,)
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
    this.baJob.setCall('support.new_ticket', [this.payload]);
    this.baJob.submit();
    
  };
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

  onProgress(progress) {}

  onSuccess(job) {
    this.baJob.setDescription('Your ticket has been submitted.');
  }

  onFailure(job) {}
}

import {ApplicationRef, Component, OnInit, Injector} from '@angular/core';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';

import {GlobalState} from '../../../global.state';
import {RestService, UserService, WebSocketService} from '../../../services/';
import {EntityConfigComponent} from '../../common/entity/entity-config/';
import {FieldConfig
} from '../../common/entity/entity-form/models/field-config.interface';
import { FileUploader } from 'ng2-file-upload';
@Component({
  selector : 'app-support',
  templateUrl : './support.component.html',
  styleUrls : [ './support.component.css' ],
})

export class SupportComponent {
  username: any;
  password: any;
  categories: any;
  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService, protected _injector: Injector,
              protected _appRef: ApplicationRef, protected _state: GlobalState,)
              {
              }
  private category: any;
  onSubmit(): void{
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
}
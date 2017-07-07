import {ApplicationRef, Component, Injector, Inject,OnInit, NgZone, ViewChild
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  Validators
} from '@angular/forms';

import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';

import {GlobalState} from '../../../global.state';
import {RestService, UserService, WebSocketService} from '../../../services/';
import {EntityConfigComponent} from '../../common/entity/entity-config/';
import {
  FieldConfig
} from '../../common/entity/entity-form/models/field-config.interface';
import {BaJob} from '../../../theme/components';
const URL = '/tmp/';

@Component({
  selector : 'app-support',
  template : `
  <entity-form [conf]="this"></entity-form>
  `
})
export class SupportComponent {
  protected resource_name: string = 'network/globalconfiguration/';
  public fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'username',
      placeholder : 'Username',
    },
    {
      type : 'input',
      name : 'password',
      placeholder : 'Password',
    },
    {
      type : 'select',
      name : 'type',
      placeholder : 'Type',
      options : [
        {label : 'Bug', value : 'bug'},
        {label : 'Feature', value : 'feature'},
      ],
    },
    {
      type : 'select',
      name : 'category',
      placeholder : 'Category',
      options: [

      ]
    },
    {
      type : 'checkbox',
      name : 'attach_debug_info',
      placeholder : 'Attach Debug Info',
    },
    {
      type : 'input',
      name : 'subject',
      placeholder : 'subject',
    },
    {
      type : 'textarea',
      name : 'description',
      placeholder : 'Description',
      inputType : 'password',
    },
    {
      type: 'upload',
      name : 'file',
      placeholder: 'File Upload',
    }
  ];
}

import {
  ApplicationRef,
  Component,
  Injector,
  OnInit,
  ViewContainerRef
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
import {RestService, WebSocketService} from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'app-replication-edit',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class ReplicationEditComponent {

  protected resource_name = 'storage/replication';
  protected route_success: string[] = [ 'tasks', 'replication'];
  protected isNew = false;
  protected isEntity = true;
  
  
  protected fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'repl_filesystem',
      placeholder: 'Volume/Dataset',
    },
    {
      type: 'input',
      name: 'repl_zfs',
      placeholder: "Remote ZFS Volume/Dataset"
    },
    {
      type : 'input',
      name : 'repl_remote_hostname',
      placeholder : 'Remote Hostname'
    },
    {
      type : 'input',
      name : 'repl_remote_port',
      placeholder : 'Remote Port'
    },
    {
      type: 'input',
      name: 'repl_remote_dedicateduser',
      placeholder: 'Remote User'
    },
    {
      type : 'input',
      name : 'repl_remote_cipher',
      placeholder : 'Remote Cipher'
    }, 
    { 
      type: 'input',
      name: 'repl_compression',
      placeholder: 'Stream Compression'
    },
    { 
      type: 'input',
      name: 'repl_limit',
      placeholder: 'Limit (KB/s)'
    },
    {
      type: 'input',
      name: 'repl_begin',
      placeholder: 'Begin Time'
    },
    {
      type: 'input',
      name: 'repl_end',
      placeholder: 'End Time'
    },
    {
      type: 'input',
      name: 'repl_remote_hostkey',
      placeholder: 'Remote Hostkey'
    },
    {
      type : 'checkbox',
      name : 'repl_followdelete',
      placeholder : 'Delete Stale Snapshots on Remote System'
    },
    {
        type: 'checkbox',
        name: 'repl_remote_dedicateduser_enabled',
        placeholder: 'Dedicated User'
    },
    {
      type : 'checkbox',
      name : 'repl_userepl',
      placeholder : 'Recursively Replicate Child Dataset Snapshot(s)'
    },
    {
      type : 'checkbox',
      name : 'repl_enabled',
      placeholder : 'Replication Enabled'
    }
  ];

  constructor(
      protected router: Router,
      protected route: ActivatedRoute,
      protected rest: RestService,
      protected ws: WebSocketService,
      protected _injector: Injector,
      protected _appRef: ApplicationRef
  ) {

  }

  afterInit(entityForm: any) {
  }
}

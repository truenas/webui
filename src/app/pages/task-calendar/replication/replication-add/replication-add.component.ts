import {
  ApplicationRef,
  Component,
  Injector,
  OnInit,
  ViewContainerRef,
  ElementRef
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
import { ReplicationService } from 'app/pages/task-calendar/replication/replication.service';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';

@Component({
  selector : 'app-replication-add',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class ReplicationAddComponent {
  
  protected resource_name = 'storage/replication';
  protected route_success: string[] = [ 'tasks', 'replication'];
  protected isNew = true;
  protected isEntity = true;
  protected entityForm: EntityFormComponent;
  
  private times = [
    {label : '00:00:00', value : '00:00:00'}, 
    {label : '00:15:00', value : '00:15:00'}, 
    {label : '00:30:00', value : '00:35:00'}, 
    {label : '00:45:00', value : '00:45:00'},
    {label : '01:00:00', value : '01:00:00'}, 
    {label : '01:15:00', value : '01:15:00'}, 
    {label : '01:30:00', value : '01:35:00'}, 
    {label : '01:45:00', value : '01:45:00'},
    {label : '02:00:00', value : '02:00:00'}, 
    {label : '02:15:00', value : '02:15:00'}, 
    {label : '02:30:00', value : '02:35:00'}, 
    {label : '02:45:00', value : '02:45:00'},
    {label : '03:00:00', value : '03:00:00'}, 
    {label : '03:15:00', value : '03:15:00'}, 
    {label : '03:30:00', value : '03:35:00'}, 
    {label : '03:45:00', value : '03:45:00'},
    {label : '04:00:00', value : '04:00:00'}, 
    {label : '04:15:00', value : '04:15:00'}, 
    {label : '04:30:00', value : '04:35:00'}, 
    {label : '04:45:00', value : '04:45:00'},
    {label : '05:00:00', value : '05:00:00'}, 
    {label : '05:15:00', value : '05:15:00'}, 
    {label : '05:30:00', value : '05:35:00'}, 
    {label : '05:45:00', value : '05:45:00'},
    {label : '06:00:00', value : '06:00:00'}, 
    {label : '06:15:00', value : '06:15:00'}, 
    {label : '06:30:00', value : '06:35:00'}, 
    {label : '06:45:00', value : '06:45:00'},
    {label : '07:00:00', value : '07:00:00'}, 
    {label : '07:15:00', value : '07:15:00'}, 
    {label : '07:30:00', value : '07:35:00'}, 
    {label : '07:45:00', value : '07:45:00'},
    {label : '08:00:00', value : '08:00:00'}, 
    {label : '08:15:00', value : '08:15:00'}, 
    {label : '08:30:00', value : '08:35:00'}, 
    {label : '08:45:00', value : '08:45:00'},
    {label : '09:00:00', value : '09:00:00'}, 
    {label : '09:15:00', value : '09:15:00'}, 
    {label : '09:30:00', value : '09:35:00'}, 
    {label : '09:45:00', value : '09:45:00'},
    {label : '10:00:00', value : '10:00:00'}, 
    {label : '10:15:00', value : '10:15:00'}, 
    {label : '10:30:00', value : '10:35:00'}, 
    {label : '10:45:00', value : '10:45:00'},
    {label : '11:00:00', value : '11:00:00'}, 
    {label : '11:15:00', value : '11:15:00'}, 
    {label : '11:30:00', value : '11:35:00'}, 
    {label : '11:45:00', value : '11:45:00'},
    {label : '12:00:00', value : '12:00:00'}, 
    {label : '12:15:00', value : '12:15:00'}, 
    {label : '12:30:00', value : '12:35:00'}, 
    {label : '12:45:00', value : '12:45:00'},
    {label : '13:00:00', value : '13:00:00'}, 
    {label : '13:15:00', value : '13:15:00'}, 
    {label : '13:30:00', value : '13:35:00'}, 
    {label : '13:45:00', value : '13:45:00'},
    {label : '14:00:00', value : '14:00:00'}, 
    {label : '14:15:00', value : '14:15:00'}, 
    {label : '14:30:00', value : '14:35:00'}, 
    {label : '14:45:00', value : '14:45:00'},
    {label : '15:00:00', value : '15:00:00'}, 
    {label : '15:15:00', value : '15:15:00'}, 
    {label : '15:30:00', value : '15:35:00'}, 
    {label : '15:45:00', value : '15:45:00'},
    {label : '16:00:00', value : '16:00:00'}, 
    {label : '16:15:00', value : '16:15:00'}, 
    {label : '16:30:00', value : '16:35:00'}, 
    {label : '16:45:00', value : '16:45:00'},
    {label : '17:00:00', value : '17:00:00'}, 
    {label : '17:15:00', value : '17:15:00'}, 
    {label : '17:30:00', value : '17:35:00'}, 
    {label : '17:45:00', value : '17:45:00'},
    {label : '18:00:00', value : '18:00:00'}, 
    {label : '18:15:00', value : '18:15:00'}, 
    {label : '18:30:00', value : '18:35:00'}, 
    {label : '18:45:00', value : '18:45:00'},
    {label : '19:00:00', value : '19:00:00'}, 
    {label : '19:15:00', value : '19:15:00'}, 
    {label : '19:30:00', value : '19:35:00'}, 
    {label : '19:45:00', value : '19:45:00'},
    {label : '20:00:00', value : '20:00:00'}, 
    {label : '20:15:00', value : '20:15:00'}, 
    {label : '20:30:00', value : '20:35:00'}, 
    {label : '20:45:00', value : '20:45:00'},
    {label : '21:00:00', value : '21:00:00'}, 
    {label : '21:15:00', value : '21:15:00'}, 
    {label : '21:30:00', value : '21:35:00'}, 
    {label : '21:45:00', value : '21:45:00'},
    {label : '22:00:00', value : '22:00:00'}, 
    {label : '22:15:00', value : '22:15:00'}, 
    {label : '22:30:00', value : '22:35:00'}, 
    {label : '22:45:00', value : '22:45:00'},
    {label : '23:00:00', value : '23:00:00'}, 
    {label : '23:15:00', value : '23:15:00'}, 
    {label : '23:30:00', value : '23:35:00'}, 
    {label : '23:45:00', value : '23:45:00'}
  ];
  
  
  protected fieldConfig: FieldConfig[];

  constructor(
      protected router: Router,
      protected route: ActivatedRoute,
      protected rest: RestService,
      protected ws: WebSocketService,
      protected replicationService: ReplicationService,
      protected _injector: Injector,
      protected _appRef: ApplicationRef
  ) {
    
    const theThis = this;

    

    this.fieldConfig =
    [
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
        type : 'checkbox',
        name : 'repl_userepl',
        placeholder : 'Recursively Replicate Child Dataset Snapshot(s)',
        value: false
      },
      {
        type : 'checkbox',
        name : 'repl_followdelete',
        placeholder : 'Delete Stale Snapshots on Remote System',
        value: false
      },
      { 
        type: 'input',
        name: 'repl_limit',
        placeholder: 'Limit (KB/s)',
        inputType: 'number'
      },
      {
        type: 'select',
        name: 'repl_begin',
        placeholder: 'Begin Time',
        options : this.times
      },
      {
        type: 'select',
        name: 'repl_end',
        placeholder: 'End Time',
        options : this.times
      },
      {
        type : 'input',
        name : 'repl_remote_hostname',
        placeholder : 'Remote Hostname'
      },
      {
        type : 'input',
        name : 'repl_remote_port',
        placeholder : 'Remote Port',
        inputType: 'number'
      },
      {
        type: 'input',
        name: 'repl_remote_dedicateduser',
        placeholder: 'Remote User'
      },
      {
        type : 'select',
        name : 'repl_remote_cipher',
        placeholder : 'Remote Cipher',
        options : [
          {label : 'standard', value : 'standard'}, 
          {label : 'fast', value : 'fast'},
          {label : 'disabled', value : 'disabled'}
        ]
      },{

        type : 'select',
        name : 'repl_remote_mode',
        placeholder : 'Remote Mode',
        options : [
          {label : 'MANUAL', value : 'MANUAL'}, 
          {label : 'SEMIAUTOMATIC', value : 'SEMIAUTOMATIC'}
        ]
      }, 
      { 
        type: 'select',
        name: 'repl_compression',
        placeholder: 'Stream Compression',
        options : [
          {label : 'Off', value : 'off'}, 
          {label : 'lz4 (fastest)', value : 'lz4'},
          {label : 'pigz (all rounder)', value : 'pigz'},
          {label : 'pizip (all rounder)', value : 'pizip'}
        ]
      },
      {
        type: 'textareabutton',
        name: 'repl_remote_hostkey',
        placeholder: 'Remote Hostkey',
        customEventActionLabel: 'Remote SSH Key',
        customEventMethod: function(data) {
          theThis.customEventMethod(data);
        }
      },
      {
          type: 'checkbox',
          name: 'repl_remote_dedicateduser_enabled',
          placeholder: 'Dedicated User(Root used if false)',
          value: false
      },
      {
        type: 'input',
        name: 'repl_remote_dedicateduser',
        placeholder: 'Remote User',
        value: "root"
      },
      {
        type : 'checkbox',
        name : 'repl_enabled',
        placeholder : 'Replication Enabled',
        value: false
      }
    ];
  }

  afterInit(entityForm: any) {
    this.entityForm = entityForm;
  }

  customEventMethod( data: any ) {
    const textAreaSSH: ElementRef = (<ElementRef>data.textAreaSSH);
    const hostName: string = this.entityForm.value.repl_remote_hostname;
    const port: number = Number(this.entityForm.value.repl_remote_port);
    
    this.replicationService.getSSHKeyscan( hostName, port).subscribe((sshKeyData)=>{
      textAreaSSH.nativeElement.value = sshKeyData;
      this.entityForm.formGroup.controls.repl_remote_hostkey.setValue(sshKeyData);   
    });
  }

}

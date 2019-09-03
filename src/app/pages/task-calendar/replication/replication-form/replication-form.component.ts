import {
  ApplicationRef,
  Component,
  Injector,
  ElementRef,
  OnDestroy
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import * as _ from 'lodash';

import { RestService, WebSocketService } from '../../../../services/';
import { DialogService } from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';
import { ReplicationService } from 'app/pages/task-calendar/replication/replication.service';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import helptext from '../../../../helptext/task-calendar/replication-form/replication-form';
import { EntityUtils } from 'app/pages/common/entity/utils';

@Component({
  selector : 'app-replication-form',
  templateUrl : './replication-form.component.html'
})
export class ReplicationFormComponent implements OnDestroy {

  protected resource_name = 'storage/replication';
  protected route_success: string[] = [ 'tasks', 'replication'];
  protected isNew = false;
  protected isEntity = true;
  public initialized = false;
  protected entityForm: EntityFormComponent;
  private subscription;

  private times = [
    {label : '00:00:00', value : '00:00:00'},
    {label : '00:15:00', value : '00:15:00'},
    {label : '00:30:00', value : '00:30:00'},
    {label : '00:45:00', value : '00:45:00'},
    {label : '01:00:00', value : '01:00:00'},
    {label : '01:15:00', value : '01:15:00'},
    {label : '01:30:00', value : '01:30:00'},
    {label : '01:45:00', value : '01:45:00'},
    {label : '02:00:00', value : '02:00:00'},
    {label : '02:15:00', value : '02:15:00'},
    {label : '02:30:00', value : '02:30:00'},
    {label : '02:45:00', value : '02:45:00'},
    {label : '03:00:00', value : '03:00:00'},
    {label : '03:15:00', value : '03:15:00'},
    {label : '03:30:00', value : '03:30:00'},
    {label : '03:45:00', value : '03:45:00'},
    {label : '04:00:00', value : '04:00:00'},
    {label : '04:15:00', value : '04:15:00'},
    {label : '04:30:00', value : '04:30:00'},
    {label : '04:45:00', value : '04:45:00'},
    {label : '05:00:00', value : '05:00:00'},
    {label : '05:15:00', value : '05:15:00'},
    {label : '05:30:00', value : '05:30:00'},
    {label : '05:45:00', value : '05:45:00'},
    {label : '06:00:00', value : '06:00:00'},
    {label : '06:15:00', value : '06:15:00'},
    {label : '06:30:00', value : '06:30:00'},
    {label : '06:45:00', value : '06:45:00'},
    {label : '07:00:00', value : '07:00:00'},
    {label : '07:15:00', value : '07:15:00'},
    {label : '07:30:00', value : '07:30:00'},
    {label : '07:45:00', value : '07:45:00'},
    {label : '08:00:00', value : '08:00:00'},
    {label : '08:15:00', value : '08:15:00'},
    {label : '08:30:00', value : '08:30:00'},
    {label : '08:45:00', value : '08:45:00'},
    {label : '09:00:00', value : '09:00:00'},
    {label : '09:15:00', value : '09:15:00'},
    {label : '09:30:00', value : '09:30:00'},
    {label : '09:45:00', value : '09:45:00'},
    {label : '10:00:00', value : '10:00:00'},
    {label : '10:15:00', value : '10:15:00'},
    {label : '10:30:00', value : '10:30:00'},
    {label : '10:45:00', value : '10:45:00'},
    {label : '11:00:00', value : '11:00:00'},
    {label : '11:15:00', value : '11:15:00'},
    {label : '11:30:00', value : '11:30:00'},
    {label : '11:45:00', value : '11:45:00'},
    {label : '12:00:00', value : '12:00:00'},
    {label : '12:15:00', value : '12:15:00'},
    {label : '12:30:00', value : '12:30:00'},
    {label : '12:45:00', value : '12:45:00'},
    {label : '13:00:00', value : '13:00:00'},
    {label : '13:15:00', value : '13:15:00'},
    {label : '13:30:00', value : '13:30:00'},
    {label : '13:45:00', value : '13:45:00'},
    {label : '14:00:00', value : '14:00:00'},
    {label : '14:15:00', value : '14:15:00'},
    {label : '14:30:00', value : '14:30:00'},
    {label : '14:45:00', value : '14:45:00'},
    {label : '15:00:00', value : '15:00:00'},
    {label : '15:15:00', value : '15:15:00'},
    {label : '15:30:00', value : '15:30:00'},
    {label : '15:45:00', value : '15:45:00'},
    {label : '16:00:00', value : '16:00:00'},
    {label : '16:15:00', value : '16:15:00'},
    {label : '16:30:00', value : '16:30:00'},
    {label : '16:45:00', value : '16:45:00'},
    {label : '17:00:00', value : '17:00:00'},
    {label : '17:15:00', value : '17:15:00'},
    {label : '17:30:00', value : '17:30:00'},
    {label : '17:45:00', value : '17:45:00'},
    {label : '18:00:00', value : '18:00:00'},
    {label : '18:15:00', value : '18:15:00'},
    {label : '18:30:00', value : '18:30:00'},
    {label : '18:45:00', value : '18:45:00'},
    {label : '19:00:00', value : '19:00:00'},
    {label : '19:15:00', value : '19:15:00'},
    {label : '19:30:00', value : '19:30:00'},
    {label : '19:45:00', value : '19:45:00'},
    {label : '20:00:00', value : '20:00:00'},
    {label : '20:15:00', value : '20:15:00'},
    {label : '20:30:00', value : '20:30:00'},
    {label : '20:45:00', value : '20:45:00'},
    {label : '21:00:00', value : '21:00:00'},
    {label : '21:15:00', value : '21:15:00'},
    {label : '21:30:00', value : '21:30:00'},
    {label : '21:45:00', value : '21:45:00'},
    {label : '22:00:00', value : '22:00:00'},
    {label : '22:15:00', value : '22:15:00'},
    {label : '22:30:00', value : '22:30:00'},
    {label : '22:45:00', value : '22:45:00'},
    {label : '23:00:00', value : '23:00:00'},
    {label : '23:15:00', value : '23:15:00'},
    {label : '23:30:00', value : '23:30:00'},
    {label : '23:45:00', value : '23:45:00'},
    {label : '23:59:00', value : '23:59:00'},
  ];

  private repl_remote_dedicateduser: any;
  private repl_filesystem: any;
  protected fieldConfig: FieldConfig[];

  constructor(
      protected router: Router,
      protected route: ActivatedRoute,
      protected rest: RestService,
      protected ws: WebSocketService,
      protected replicationService: ReplicationService,
      protected _injector: Injector,
      protected _appRef: ApplicationRef,
      private dialog:DialogService,
      protected loader: AppLoaderService,
  ) {

    const theThis = this;

    this.fieldConfig =
    [
      {
        type : 'select',
        name : 'repl_filesystem',
        placeholder : helptext.repl_filesystem_placeholder,
        tooltip : helptext.repl_filesystem_tooltip,
        options : [],
        required: true,
        validation : helptext.repl_filesystem_validation
      },
      {
        type : 'input',
        name : 'repl_zfs',
        placeholder : helptext.repl_zfs_placeholder,
        tooltip : helptext.repl_zfs_tooltip,
        required: true,
        validation : helptext.repl_zfs_validation
      },
      {
        type : 'checkbox',
        name : 'repl_userepl',
        placeholder : helptext.repl_userepl_placeholder,
        tooltip : helptext.repl_userepl_tooltip,
        value : false
      },
      {
        type : 'checkbox',
        name : 'repl_followdelete',
        placeholder : helptext.repl_followdelete_placeholder,
        tooltip : helptext.repl_followdelete_tooltip,
        value : false
      },
      {
        type : 'select',
        name : 'repl_compression',
        placeholder : helptext.repl_compression_placeholder,
        tooltip : helptext.repl_compression_tooltip,
        options : [
          {label : 'Off', value : 'off'},
          {label : 'lz4 (fastest)', value : 'lz4'},
          {label : 'pigz (all rounder)', value : 'pigz'},
          {label : 'plzip (best compression)', value : 'plzip'}
        ]
      },
      {
        type : 'input',
        name : 'repl_limit',
        placeholder : helptext.repl_limit_placeholder,
        tooltip :helptext.repl_limit_tooltip,
        value : 0,
        validation : helptext.repl_limit_validation
      },
      {
        type : 'select',
        name : 'repl_begin',
        placeholder : helptext.repl_begin_placeholder,
        tooltip : helptext.repl_begin_tooltip,
        options : this.times
      },
      {
        type : 'select',
        name : 'repl_end',
        placeholder : helptext.repl_end_placeholder,
        tooltip : helptext.repl_end_tooltip,
        options : this.times
      },
      {
        type : 'checkbox',
        name : 'repl_enabled',
        placeholder : helptext.repl_enabled_placeholder,
        tooltip : helptext.repl_enabled_tooltip,
        value: true
      },
      {
        type : 'select',
        name : 'repl_remote_mode',
        placeholder : helptext.repl_remote_mode_placeholder,
        tooltip : helptext.repl_remote_mode_tooltip,
        options : [
          {label : 'Manual', value : 'MANUAL'},
          {label : 'Semi-Automatic', value : 'SEMIAUTOMATIC'}
        ],
        isHidden: false
      },
      {
        type : 'input',
        name : 'repl_remote_hostname',
        placeholder : helptext.repl_remote_hostname_placeholder,
        tooltip : helptext.repl_remote_hostname_tooltip,
        required: true,
        validation: helptext.repl_remote_hostname_validation
      },
      {
        type : 'input',
        name : 'repl_remote_port',
        placeholder : helptext.repl_remote_port_placeholder,
        tooltip : helptext.repl_remote_port_tooltip,
        inputType : 'number',
        value : 22,
        validation : helptext.repl_remote_port_validation,
        isHidden : false
      },
      {
        type : 'input',
        name : 'repl_remote_http_port',
        placeholder : helptext.repl_remote_http_port_placeholder,
        tooltip : helptext.repl_remote_http_port_tooltip,
        inputType : 'number',
        value : 80,
        validation : helptext.repl_remote_http_port_validation,
        isHidden : true,
      },
      {
        type : 'checkbox',
        name : 'repl_remote_https',
        placeholder :  helptext.repl_remote_https_placeholder,
        tooltip : helptext.repl_remote_https_tooltip,
        isHidden : true,
      },
      {
        type : 'input',
        name : 'repl_remote_token',
        placeholder : helptext.repl_remote_token_placeholder,
        tooltip : helptext.repl_remote_token_tooltip,
        isHidden : true,
      },
      {
        type : 'select',
        name : 'repl_remote_cipher',
        placeholder : helptext.repl_remote_cipher_placeholder,
        tooltip : helptext.repl_remote_cipher_tooltip,
        options : [
          {label : 'standard', value : 'standard'},
          {label : 'fast', value : 'fast'},
          {label : 'disabled', value : 'disabled'}
        ]
      },
      {
        type : 'checkbox',
        name : 'repl_remote_dedicateduser_enabled',
        placeholder : helptext.repl_remote_dedicateduser_enabled_placeholder,
        tooltip : helptext.repl_remote_dedicateduser_enabled_tooltip,
    },
      {
        type : 'select',
        name : 'repl_remote_dedicateduser',
        placeholder : helptext.repl_remote_dedicateduser_placeholder,
        tooltip : helptext.repl_remote_dedicateduser_tooltip,
        options : [],
        relation : [ {
          action : "DISABLE",
          when : [ {name:'repl_remote_dedicateduser_enabled', value: false }]
        } ]
      },
      {
        type : 'textareabutton',
        name : 'repl_remote_hostkey',
        placeholder : helptext.repl_remote_hostkey_placeholder,
        tooltip : helptext.repl_remote_hostkey_tooltip,
        customEventActionLabel : 'Scan SSH Key',
        customEventMethod : function(data) {
          theThis.customEventMethod(data);
        },
        isHidden : false,
        required: true,
        validation : helptext.repl_remote_hostkey_validation
      },
    ];
  }

  afterInit(entityForm: any) {
    this.entityForm = entityForm;
    this.subscription = entityForm.formGroup.controls['repl_remote_mode'].valueChanges.subscribe((res) => {
      if (res === 'SEMIAUTOMATIC'){
        _.find(this.fieldConfig, {'name' : 'repl_remote_port'}).isHidden = true;
        _.find(this.fieldConfig, {'name' : 'repl_remote_hostkey'}).isHidden = true;
        entityForm.setDisabled('repl_remote_hostkey', true);
        _.find(this.fieldConfig, {'name' : 'repl_remote_http_port'}).isHidden = false;
        _.find(this.fieldConfig, {'name' : 'repl_remote_https'}).isHidden = false;
        _.find(this.fieldConfig, {'name' : 'repl_remote_token'}).isHidden = false;
      } else {
        _.find(this.fieldConfig, {'name' : 'repl_remote_port'}).isHidden = false;
        _.find(this.fieldConfig, {'name' : 'repl_remote_hostkey'}).isHidden = false;
        entityForm.setDisabled('repl_remote_hostkey', false);
        _.find(this.fieldConfig, {'name' : 'repl_remote_http_port'}).isHidden = true;
        _.find(this.fieldConfig, {'name' : 'repl_remote_https'}).isHidden = true;
        _.find(this.fieldConfig, {'name' : 'repl_remote_token'}).isHidden = true;

      }

    });
    if (entityForm.isNew){
      entityForm.formGroup.controls['repl_remote_mode'].setValue('MANUAL');
      entityForm.formGroup.controls['repl_begin'].setValue('00:00:00');
      entityForm.formGroup.controls['repl_end'].setValue('23:59:00');
      entityForm.formGroup.controls['repl_remote_cipher'].setValue('standard');
      entityForm.formGroup.controls['repl_compression'].setValue('lz4');
    }
    else {
      _.find(this.fieldConfig, {'name' : 'repl_remote_mode'}).isHidden = true;
      this.rest.get(this.resource_name, {}).subscribe((res)=>{
        for (const key in entityForm.data){
          if (key === 'repl_remote_port'){
            _.find(this.fieldConfig, {'name' : 'repl_remote_http_port'}).isHidden = true;
            _.find(this.fieldConfig, {'name' : 'repl_remote_https'}).isHidden = true;
          }
        }
      });
    }
    this.repl_remote_dedicateduser = _.find(this.fieldConfig, {'name' : 'repl_remote_dedicateduser'});
    this.ws.call('user.query').subscribe((res)=>{
      res.forEach((item) => {
        this.repl_remote_dedicateduser.options.push({label : item.username, value : item.username})
      });
    })

    this.repl_filesystem = _.find(this.fieldConfig, {'name' : 'repl_filesystem'});
    this.ws.call('pool.snapshottask.query').subscribe((res) => {
      for (let i = 0; i < res.length; i++) {
        const option = {label:  res[i].filesystem, value:  res[i].filesystem}
        if (!_.find(this.repl_filesystem.options, option)) {
          this.repl_filesystem.options.push(option);
        }
      }
    });
  }

  customEventMethod( data: any ) {
    const currField = _.find(this.fieldConfig, {'name' : 'repl_remote_hostkey'});
    currField.hasErrors = false;

    const textAreaSSH: ElementRef = (<ElementRef>data.textAreaSSH);
    const hostName: string = this.entityForm.value.repl_remote_hostname;
    const port: number = Number(this.entityForm.value.repl_remote_port);
    if (hostName == null || hostName == '' || port == 0) {
      currField.hasErrors = true;
      currField.errors = 'Please config remote hostname and port first.';
      return;
    }
    this.loader.open();

    this.ws.call('replication.ssh_keyscan', [hostName, port]).subscribe((res)=> {
      this.loader.close();
      textAreaSSH.nativeElement.value = res;
      this.entityForm.formGroup.controls.repl_remote_hostkey.setValue(res);

    }, (error)=>{
      this.loader.close();
      new EntityUtils().handleWSError(this, error);
    });


  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}

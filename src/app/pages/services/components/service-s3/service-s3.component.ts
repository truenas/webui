import {ApplicationRef, Component, Injector, OnInit} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  Validators
} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';

import {
  RestService,
  SystemGeneralService,
  WebSocketService
} from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';
import {
  matchOtherValidator
} from '../../../common/entity/entity-form/validators/password-validation';

@Component({
  selector : 's3-edit',
  template : `<entity-form [conf]="this"></entity-form>`,
  providers : [ SystemGeneralService ]
})

export class ServiceS3Component implements OnInit {
  protected resource_name: string = 'services/s3';
  protected addCall: string = 's3.update';
  protected route_success: string[] = [ 'services' ];
  private certificate: any;
  private ip_address: any;


  public fieldConfig: FieldConfig[] = [
    {
      type : 'select',
      name : 'bindip',
      placeholder : 'IP Address',
      tooltip: 'The IP address on which to run the S3 service; 0.0.0.0\
 sets the server to listen on all addresses.',
      options : []
    },
    {
      type : 'input',
      name : 'bindport',
      placeholder : 'Port',
      tooltip: 'TCP port on which to provide the S3 service (default 9000).',
    },
    {
      type : 'input',
      name : 'access_key',
      placeholder : 'Access Key',
      tooltip: 'Enter the S3 username.',
    },
    {
      type : 'input',
      name : 'secret_key',
      placeholder : 'Secret Key',
      tooltip: 'The password to be used by connecting S3 systems; must\
 be at least 8 but no more than 40 characters long.',
      inputType : 'password'
    },
    {
      type : 'input',
      name : 'secret_key2',
      placeholder : 'Confirm S3 Key',
      tooltip: 'Re-enter the S3 password to confirm.',
      inputType : 'password',
      validation : [ matchOtherValidator('secret_key') ],
    },
    {
      type : 'explorer',
      initial: '/mnt',
      name : 'storage_path',
      placeholder : 'Disk',
      tooltip: 'S3 filesystem directory.',
    },
    {
      type : 'checkbox',
      name : 'browser',
      placeholder : 'Enable Browser',
      tooltip: 'Enable the web user interface for the S3 service.',
    },
    {
      type : 'select',
      name : 'mode',
      placeholder : 'Mode',
      options : []
    },
    {
      type : 'select',
      name : 'certificate',
      placeholder : 'Certificate',
      options : []
    },
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected systemGeneralService: SystemGeneralService) {}

  ngOnInit() {}

  afterInit(entityForm: any) { 
    this.systemGeneralService.getCertificates().subscribe((res)=>{
      this.certificate = _.find(this.fieldConfig, {name:'certificate'});
      res.forEach(element => {
        this.certificate.options.push({label:element[1], value: element[0]})
      });
    });
    this.systemGeneralService.getIPChoices().subscribe(res=>{
      this.ip_address = _.find(this.fieldConfig,{name:'bindip'});
      res.forEach(element => {
        this.ip_address.options.push({label:element[1], value: element[0]})
      });
    })

  }
}

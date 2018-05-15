import {
  ApplicationRef,
  Component,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import {
  FormGroup, Validators,
} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {Subscription} from 'rxjs/Subscription';

import {RestService, WebSocketService} from '../../../../../services/';
import {
  FieldConfig
} from '../../../../common/entity/entity-form/models/field-config.interface';
import { T } from '../../../../../translate-marker';

@Component({
  selector : 'app-zvol-add',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class ZvolAddComponent {

  protected pk: any;
  protected path: string;
  public sub: Subscription;
  protected route_success: string[] = [ 'storage', 'pools' ];
  protected compression: any;
  protected advanced_field: Array<any> = [ 'blocksize' ];
  protected isBasicMode = true;
  protected isNew = true;
  protected isEntity = true;

  get resource_name(): string {
    return 'storage/volume/' + this.pk + '/zvols/';
  }

  get custom_add_query(): string {
    return this.resource_name;
  }

  public fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'name',
      placeholder: T('zvol name:'),
      tooltip: T('Keep the <b>zvol name</b> short. Using a <b>zvol name</b>\
 longer than 63 characters can prevent accessing the zvol as a device.'),
      validation: [Validators.required],
      required: true
    },
    {
      type: 'input',
      name: 'comments',
      placeholder: T('comments:'),
      tooltip: T('Add any notes about this zvol.'),
    },
    {
      type: 'select',
      name: 'compression',
      placeholder: T('Compression level:'),
      tooltip: T('Choose a compression algorithm. The\
 <b>Storage/Volumes/Create Dataset/Compression</b> of the\
 <a href="guide">Guide</a> fully describes each option.'),
      options: [
        {label : 'Inherit', value : "inherit"},
        {label : 'Off', value : "off"},
        {label : 'lz4 (recommended)', value : "lz4"},
        {label : 'gzip (default level, 6)', value : "gzip"},
        {label : 'gzip (fastest)', value : "gzip-1"},
        {label : 'gzip (maximum, slow)', value : "gzip-9"},
        {label : 'zle (runs of zeros)', value : "zle"},
        {label : 'lzjb (legacy, not recommended)', value : "lzjb"},
      ],
      validation: [Validators.required],
      required: true,
      value: "inherit"
    },
    {
      type: 'select',
      name: 'dedup',
      placeholder: T('ZFS Deduplication:'),
      tooltip : T('Activates the process for ZFS to transparently reuse a\
 single copy of duplicated data to save space. See the\
 <b>Storage/Volumes/Create Dataset/Deduplication</b> section of the\
 <a href="guide">Guide</a> for more details.'),
      options: [
        {label : 'Inherit (off)', value : "inherit"},
        {label : 'On', value : "on"},
        {label : 'Verify', value : "verify"},
        {label : 'Off', value : "off"},
      ],
      validation: [Validators.required],
      required: true,
      value:"inherit"
    },
    {
      type: 'input',
      name: 'volsize',
      placeholder: T('Size for this zvol:'),
      tooltip : T('Specify a size and value such as <i>10 GiB</i>.'),
      validation: [Validators.required],
      required: true,
    },
    {
      type: 'checkbox',
      name : 'force',
      placeholder: T('Force size:'),
      tooltip : T('By default, the system does not allow a zvol to be\
 created that brings the pool to over 80% capacity. Check this box to\
 force the creation of the zvol (<b>NOT Recommended</b>).'),
    }
  ];

  isCustActionVisible(actionId: string) {
    if (actionId === 'advanced_mode' && this.isBasicMode === false) {
      return false;
    } else if (actionId === 'basic_mode' && this.isBasicMode === true) {
      return false;
    }
    return true;
  }

  constructor(protected router: Router, protected aroute: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              ) {}

  clean(value) {
     const start = this.path.split('/').splice(1).join('/');
     if (start !== '') {
       return start + '/' + value;
     } else {
       return value;
     }
  }

  afterInit(entityAdd: any) {
    this.sub = this.aroute.params.subscribe(params => {
      this.pk = params['pk'];
      this.path = params['path'];
    });
  }
}

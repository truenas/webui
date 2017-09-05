import {
  ApplicationRef,
  Component,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import {
  FormGroup,
} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {Subscription} from 'rxjs';

import {RestService, WebSocketService} from '../../../../../services/';
import {
  FieldConfig
} from '../../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'app-zvol-add',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class ZvolAddComponent {

  protected pk: any;
  protected path: string;
  public sub: Subscription;
  protected route_success: string[] = [ 'storage', 'volumes' ];
  protected compression: any;
  protected advanced_field: Array<any> = [ 'blocksize' ];
  protected isBasicMode: boolean = true;
  protected isNew: boolean = true;
  protected isEntity: boolean = true;

  get resource_name(): string {
    return 'storage/volume/' + this.pk + '/zvols/';
  }

  get custom_add_query(): string { 
    return this.resource_name; 
  }

  public fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name : 'name',
      placeholder : 'zvol name:',
    },
    {
      type: 'input',
      name: 'comments',
      placeholder: 'comments:',
    },
    {
      type: 'select',
      name: 'compression',
      placeholder: 'Compression level:',
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
    },
    {
      type: 'select',
      name: 'dedup',
      placeholder: 'ZFS Deduplication:',
      options: [
        {label : 'Inherit (off)', value : "inherit"},
        {label : 'On', value : "on"},
        {label : 'Verify', value : "verify"},
        {label : 'Off', value : "off"},
      ],
    },
    {
      type: 'input',
      name: 'volsize',
      placeholder: 'Size for this zvol:',
    },
    {
      type: 'checkbox',
      name : 'force',
      placeholder: 'Force size:',
    }
  ];

  isCustActionVisible(actionId: string) {
    if (actionId == 'advanced_mode' && this.isBasicMode == false) {
      return false;
    } else if (actionId == 'basic_mode' && this.isBasicMode == true) {
      return false;
    }
    return true;
  }

  constructor(protected router: Router, protected aroute: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              ) {}

  clean(value) {
     let start = this.path.split('/').splice(1).join('/');
     if (start != '') {
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

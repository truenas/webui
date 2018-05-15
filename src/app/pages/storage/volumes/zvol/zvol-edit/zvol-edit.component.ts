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

import * as _ from 'lodash';
import {Subscription} from 'rxjs/Subscription';

import {RestService, WebSocketService} from '../../../../../services/';
import {EntityUtils} from '../../../../common/entity/utils';
import {
  FieldConfig
} from '../../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'app-zvol-edit',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class ZvolEditComponent {

  protected pk: any;
  protected path: string;
  protected zvol: string;
  public sub: Subscription;
  public formGroup: FormGroup;
  public data: Object = {};
  public error: string;
  public busy: Subscription;
  protected fs: any = (<any>window).filesize;
  protected route_success: string[] = [ 'storage', 'pools' ];

  get resource_name(): string {
    return 'storage/volume/' + this.pk + '/zvols/';
  }

  get custom_get_query(): string {
    return this.resource_name + this.zvol + '/';
  }

  get custom_edit_query(): string {
    return this.resource_name + this.zvol + '/';
  }

  public fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name : 'name',
      placeholder : 'zvol name:',
      tooltip: 'Keep the <b>zvol name</b> short. Using a <b>zvol name</b>\
 longer than 63 characters can prevent accessing the zvol as a device.',
      readonly: true
    },
    {
      type: 'input',
      name: 'comments',
      placeholder: 'comments:',
      tooltip: 'Add any notes about this zvol.',
    },
    {
      type: 'select',
      name: 'compression',
      placeholder: 'Compression level:',
      tooltip: 'Choose a compression algorithm. The\
 <b>Storage/Volumes/Create Dataset/Compression</b> of the\
 <a href="guide">Guide</a> fully describes each option.',
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
      tooltip : 'Activates the process for ZFS to transparently reuse a\
 single copy of duplicated data to save space. See the\
 <b>Storage/Volumes/Create Dataset/Deduplication</b> section of the\
 <a href="guide">Guide</a> for more details.',
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
      tooltip : 'Specify a size and value such as <i>10 GiB</i>.',
    },
    {
      type: 'checkbox',
      name : 'force',
      placeholder: 'Force size:',
      tooltip : 'By default, the system does not allow a zvol to be\
 created that brings the pool to over 80% capacity. Check this box to\
 force the creation of the zvol (<b>NOT Recommended</b>).',
    }
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected aroute: ActivatedRoute, protected rest: RestService,
              protected ws: WebSocketService) {}

  initial(entityEdit) {
    entityEdit.formGroup.controls.volsize.setValue(
        this.fs(entityEdit.data.volsize, {standard : "iec"}));
  }

  preInit(entityEdit: any) {
    this.sub = this.aroute.params.subscribe(params => {
      this.pk = params['pk'];
      this.path = params['path'];
      this.zvol = this.path.slice(this.pk.length + 1, this.path.length);
    });
  }
}

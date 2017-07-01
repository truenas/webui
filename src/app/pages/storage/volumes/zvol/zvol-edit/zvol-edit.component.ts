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
import {check} from '@angular/tsc-wrapped/src/tsc';
import {
  DynamicCheckboxModel,
  DynamicFormControlModel,
  DynamicFormService,
  DynamicInputModel,
  DynamicRadioGroupModel,
  DynamicSelectModel
} from '@ng2-dynamic-forms/core';
import filesize from 'filesize';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';

import {GlobalState} from '../../../../../global.state';
import {RestService, WebSocketService} from '../../../../../services/';
import {EntityUtils} from '../../../../common/entity/utils';

@Component({
  selector : 'app-zvol-edit',
  template : `<entity-edit [conf]="this"></entity-edit>`
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
  protected fs: any = filesize;
  protected route_success: string[] = [ 'storage', 'volumes' ];

  get resource_name(): string {
    return 'storage/volume/' + this.pk + '/zvols/';
  }

  get custom_get_query(): string {
    return this.resource_name + this.zvol + '/';
  }

  get custom_edit_query(): string {
    return this.resource_name + this.zvol + '/';
  }

  public formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
      id : 'name',
      label : 'zvol name:',
      readOnly : true,
    }),
    new DynamicInputModel({
      id : 'comments',
      label : 'comments:',
    }),
    new DynamicSelectModel({
      id : 'compression',
      label : 'Compression level:',
      options : [
        {label : 'Inherit', value : "inherit"},
        {label : 'Off', value : "off"},
        {label : 'lz4 (recommended)', value : "lz4"},
        {label : 'gzip (default level, 6)', value : "gzip"},
        {label : 'gzip (fastest)', value : "gzip-1"},
        {label : 'gzip (maximum, slow)', value : "gzip-9"},
        {label : 'zle (runs of zeros)', value : "zle"},
        {label : 'lzjb (legacy, not recommended)', value : "lzjb"},
      ],
    }),
    new DynamicSelectModel({
      id : 'dedup',
      label : 'ZFS Deduplication:',
      options : [
        {label : 'Inherit (off)', value : "inherit"},
        {label : 'On', value : "on"},
        {label : 'Verify', value : "verify"},
        {label : 'Off', value : "off"},
      ],
    }),
    new DynamicInputModel({
      id : 'volsize',
      label : 'Size for this zvol:',
    }),
    new DynamicCheckboxModel({
      id : 'force',
      label : 'Force size:',
    })

  ];
  private compression: DynamicSelectModel<string>;
  private dedup: DynamicSelectModel<string>;
  private comments: DynamicInputModel;
  constructor(protected router: Router, protected route: ActivatedRoute,
              protected aroute: ActivatedRoute, protected rest: RestService,
              protected ws: WebSocketService,
              protected formService: DynamicFormService) {}

  initial(entityEdit) {
    entityEdit.formGroup.controls.volsize.setValue(
        this.fs(entityEdit.data.volsize, {standard : "iec"}));
  }

  preInit(entityEdit: any) {
    this.compression = <DynamicSelectModel<string>>this.formService.findById(
        "compression", this.formModel);
    this.dedup = <DynamicSelectModel<string>>this.formService.findById(
        "dedup", this.formModel);
    this.comments = <DynamicInputModel>this.formService.findById(
        "comments", this.formModel);
    this.sub = this.aroute.params.subscribe(params => {
      this.pk = params['pk'];
      this.path = params['path'];
      this.zvol = this.path.slice(this.pk.length + 1, this.path.length);
    });
  }
}

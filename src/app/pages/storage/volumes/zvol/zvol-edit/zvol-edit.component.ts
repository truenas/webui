import { ApplicationRef, Component, OnInit, ViewContainerRef } from '@angular/core';
import { FormGroup, } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicSelectModel, DynamicRadioGroupModel } from '@ng2-dynamic-forms/core';
import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService } from '../../../../../services/';

import { Subscription } from 'rxjs';
import { EntityUtils } from '../../../../common/entity/utils.ts';

import * as _ from 'lodash';

@Component({
  selector: 'app-zvol-edit',
  template: `<entity-edit [conf]="this"></entity-edit>`
})
export class ZvolEditComponent {

  protected pk: any;
  protected path: string;
  protected zvol: string;
  private sub: Subscription;
  protected formGroup: FormGroup;
  public data: Object = {};
  public error: string;
  private busy: Subscription;
  protected route_success: string[] = ['storage', 'volumes'];
  get resource_name(): string {
    return 'storage/volume/' + this.pk + '/zvols/';
  }
  get custom_get_query() : string {
    return this.resource_name + this.zvol + '/';
  }
  get custom_edit_query(): string {
    return this.resource_name + this.zvol + '/';
  }
  protected formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
      id: 'name',
      label: 'zvol name:',
      readOnly: true,
    }),
    new DynamicSelectModel({
      id: 'compression',
      label: 'Compression level:',
      options: [
        { label: 'Inherit (lz4)', value: "lz4" },
        { label: 'Off', value: "off" },
        { label: 'lz4 (recommended)', value: "lz4" },
        { label: 'gzip (default level, 6)', value: "gzip" },
        { label: 'gzip (fastest)', value: "gzip-1" },
        { label: 'gzip (maximum, slow)', value: "gzip-9" },
        { label: 'zle (runs of zeros)', value: "zle" },
        { label: 'lzjb (legacy, not recommended)', value: "lzjb" },
      ],
    }),
    new DynamicSelectModel({
      id: 'dedup',
      label: 'ZFS Deduplication:',
      options: [
        { label: 'Inherit (off)', value: "inherit" },
        { label: 'On', value: "on" },
        { label: 'Verify', value: "verify" },
        { label: 'Off', value: "off" },
      ],
    }),
    new DynamicInputModel({
      id: 'volsize',
      label: 'Size for this zvol:',
    }),

  ];
  private compression: DynamicSelectModel<string>;
  private dedup: DynamicSelectModel<string>;


  constructor(protected router: Router, protected route: ActivatedRoute, protected aroute: ActivatedRoute, protected rest: RestService, protected ws: WebSocketService, protected formService: DynamicFormService) {
    
  }

  preInit(entityEdit: any) {
    this.compression = <DynamicSelectModel<string>>this.formService.findById("compression", this.formModel);
    this.dedup = <DynamicSelectModel<string>>this.formService.findById("dedup", this.formModel);
    this.sub = this.aroute.params.subscribe(params => {
      this.pk = params['pk'];
      this.path = params['path'];
      this.zvol = this.path.slice(this.pk.length + 1, this.path.length);
    });
  }

}

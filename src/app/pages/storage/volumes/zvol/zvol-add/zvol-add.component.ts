import { ApplicationRef, Component, OnInit, ViewContainerRef } from '@angular/core';
import { FormGroup, } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicSelectModel, DynamicRadioGroupModel } from '@ng2-dynamic-forms/core';
import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService } from '../../../../../services/';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-zvol-add',
  template: `<entity-add [conf]="this"></entity-add>`
})
export class ZvolAddComponent {

  protected pk: any;
  protected path: string;
  private sub: Subscription;
  protected route_success: string[] = ['storage', 'volumes'];
  protected compression: any;
  protected advanced_field: Array<any> = ['blocksize'];
  protected isBasicMode: boolean = true;

  get resource_name(): string {
    return 'storage/volume/' + this.pk + '/zvols';
  }

  protected formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
      id: 'comments',
      label: 'Comments:',
    }),
    new DynamicInputModel({
      id: 'name',
      label: 'zvol name:',
    }),
    new DynamicInputModel({
      id: 'volsize',
      label: 'Size for this zvol:',
    }),
    new DynamicCheckboxModel({
      id: 'force',
      label: 'Force size:',
    }),
    new DynamicSelectModel({
      id: 'compression',
      label: 'Compression level:',
      options: [
        { label: 'Inherit', value: "inherit" },
        { label: 'Off', value: "off" },
        { label: 'lz4 (recommended)', value: "lz4" },
        { label: 'gzip (default level, 6)', value: "gzip" },
        { label: 'gzip (fastest)', value: "gzip-1" },
        { label: 'gzip (maximum, slow)', value: "gzip-9" },
        { label: 'zle (runs of zeros)', value: "zle" },
        { label: 'lzjb (legacy, not recommended)', value: "lzjb" },
      ],
    }),
    new DynamicCheckboxModel({
      id: 'sparse',
      label: 'Sparse Volume:',
    }),
    new DynamicSelectModel({
      id: 'blocksize',
      'label':'Block size:',
      options:[
        { label:'512',value: '512'},
        { label:'1K', value: '1K'},
        { label:'2K', value: '2K'},
        { label:'4K', value: '4K'},
        { label:'8K', value: '8K'},
        { label:'16K', value: '16K'},
        { label:'32K', value: '32K'},
        { label:'64K', value: '64K'},
        { label:'128K', value: '128K'},
        ],
        value: "16K"
      })

  ];

    isCustActionVisible(actionId: string) {
    if (actionId == 'advanced_mode' && this.isBasicMode == false) {
      return false;
    } else if (actionId == 'basic_mode' && this.isBasicMode == true) {
      return false;
    }
    return true;
  }

  protected custActions: Array<any> = [
    {
      id: 'basic_mode',
      name: 'Basic Mode',
      function: () => {
        this.isBasicMode = !this.isBasicMode;
      }
    },
    {
      'id': 'advanced_mode',
      name: 'Advanced Mode',
      function: () => {
        this.isBasicMode = !this.isBasicMode;
      }
    }
  ];

  constructor(protected router: Router, protected aroute: ActivatedRoute, protected rest: RestService, protected ws: WebSocketService, protected formService: DynamicFormService) {

  }

  clean_name(value) {
    let start = this.path.split('/').splice(1).join('/');
    if(start != '') {
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

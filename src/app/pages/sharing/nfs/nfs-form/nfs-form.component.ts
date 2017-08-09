import {Component, ViewContainerRef} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {FormArray} from '@angular/forms';

import {GlobalState} from '../../../../global.state';
import {RestService, WebSocketService} from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

import {EntityFormService} from '../../../common/entity/entity-form/services/entity-form.service';
import * as _ from 'lodash';

@Component({
  selector : 'app-nfs-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class NFSFormComponent {

  protected route_success: string[] = [ 'sharing', 'nfs' ];
  protected resource_name: string = 'sharing/nfs/';
  protected isEntity: boolean = true;
  protected formArray: FormArray;

  protected fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'nfs_comment',
      placeholder: 'Comment',
    },
    {
      type: 'array',
      name : 'nfs_paths',
      initialCount: 1,
      formarray: [{
        name: 'path',
        placeholder: 'Path',
        type: 'explorer',
        initial: '/mnt',
      }]
    },
    {
      type: 'textarea',
      name : 'nfs_network',
      placeholder : 'Network',
    },
    {
      type: 'textarea',
      name: 'nfs_hosts',
      placeholder: 'Hosts',
    },
    {
      type: 'checkbox',
      name: 'nfs_alldirs',
      placeholder: 'All dirs',
    },
  ];

  protected path_count: number;
  protected arrayControl: any;
  protected initialCount: number;
  protected initialCount_default: number = 1;

  public custActions: Array<any> = [
    {
      id : 'add_path',
      name : 'Add Additional Path',
      function : () => {
        this.path_count += 1;
        this.entityFormService.insertFormArrayGroup(
            this.path_count, this.formArray, this.arrayControl.formarray);
      }
    },
    {
      id : 'remove_path',
      name : 'Remove Additional Path',
      function : () => {
        this.path_count -= 1;
        this.entityFormService.removeFormArrayGroup(this.path_count,
                                                    this.formArray);
      }
    },
  ];

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService,
              protected _state: GlobalState,
              protected entityFormService: EntityFormService,
              protected route: ActivatedRoute ) {}

  preInit(EntityForm: any) {
    this.arrayControl =
      _.find(this.fieldConfig, {'name' : 'nfs_paths'});
    this.route.params.subscribe(params => {
      if(params['pk']) {
        this.arrayControl.initialCount = 0;
      }
    });
  }
  
  afterInit(EntityForm: any) {
    this.arrayControl =
      _.find(this.fieldConfig, {'name' : 'nfs_paths'});
    if (EntityForm.isNew) {
      this.initialCount = this.path_count = 1;
    } else {
      this.initialCount = this.path_count = this.arrayControl.initialCount;
    }

    this.formArray = EntityForm.formGroup.controls['nfs_paths'];
  }

  isCustActionVisible(actionId: string) {
    if (actionId == 'remove_path' && this.initialCount <= this.initialCount_default) {
      return false;
    }
    return true;
  }

  preHandler(data: any[]): any[] {
    let paths = [];
    for (let i = 0; i < data.length; i++) {
      paths.push({path:data[i]});
    }
    console.log(paths);
    return paths;
  }

  clean(data) {
    let paths = [];
    for (let i = 0; i < data.nfs_paths.length; i++) {
      paths.push(data.nfs_paths[i]['path']);
    }
    data.nfs_paths = paths;
    return data;
  }
}

import {ApplicationRef, Component, Injector} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';

import {
  RestService,
  WebSocketService
} from '../../../services/';
import {EntityFormComponent} from '../../common/entity/entity-form';
import {
  FieldConfig
} from '../../common/entity/entity-form/models/field-config.interface';
import {Tooltip} from '../../common/tooltip';
import {TOOLTIPS} from '../../common/tooltips';

@Component({
  selector : 'app-import-disk',
  template : `
  <entity-form [conf]="this"></entity-form>
  `,
  providers : [ ],
})
export class ImportDiskComponent {
  protected editCall: string = 'pool.import_disk';
  public fieldConfig: FieldConfig[] = [
    {
      type : 'select',
      name : 'volume',
      placeholder : 'Disk',
      options: []
    },
    {
      type : 'radio',
      name : 'fs_type',
      placeholder : 'Filesystem type',
      options: [
                    {value:'UFS', label:'UFS'}, 
                    {value:'NTFS', label:'NTFS'}, 
                    {value:'MSDOSFS', label:'MSDOSFS'}, 
                    {value: 'EXT2FS', label:'EXT2FS'}
                  ]
    },
    {
      type : 'explorer',
      name : 'dst_path',
      placeholder : 'Destination Path',
      explorerType: 'directory',
      initial: '/mnt',
    },
  ];
  public diskOptions: any;
  private entityEdit: EntityFormComponent;

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              ) {}

  afterInit(entityEdit: any) { 
    this.entityEdit = entityEdit;
   }
}

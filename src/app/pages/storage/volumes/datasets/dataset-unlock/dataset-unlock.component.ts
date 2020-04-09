import {
  Component,
  OnDestroy,
} from '@angular/core';
import {
  FormGroup,
} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';

import { UserService } from '../../../../../services/user.service';
import {WebSocketService, StorageService, DialogService} from '../../../../../services/';
import { MessageService } from '../../../../common/entity/entity-form/services/message.service';
import {
  FieldConfig
} from '../../../../common/entity/entity-form/models/field-config.interface';
import { AppLoaderService } from '../../../../../services/app-loader/app-loader.service';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { T } from '../../../../../translate-marker';
import helptext from '../../../../../helptext/storage/volumes/datasets/dataset-unlock';
import { MatDialog } from '@angular/material/dialog';
import { EntityJobComponent } from '../../../../common/entity/entity-job/entity-job.component';
import {EntityUtils} from '../../../../common/entity/utils';
import { ConfirmDialog } from 'app/pages/common/confirm-dialog/confirm-dialog.component';

@Component({
  selector : 'app-dataset-unlock',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class DatasetUnlockComponent implements OnDestroy {

  protected queryCall = 'pool.dataset.encryption_summary';
  protected updateCall = 'pool.dataset.encryption_summary';
  public route_success: string[] = ['storage', 'pools'];
  protected isEntity = true;
  protected pk: string;
  protected path: string;

  public fieldSetDisplay  = 'default';//default | carousel | stepper
  public fieldConfig: FieldConfig[] = [];
  public fieldSets: FieldSet[] = [
    {
      name: helptext.dataset_unlock_title,
      class: "dataset-unlock-title",
      label: true,
      config:[
        {
          type: 'checkbox',
          name : 'unlock_key_file',
          placeholder : helptext.unlock_key_file_placeholder,
          tooltip: helptext.unlock_key_file_tooltip,
          width: '30%',
        },
        {
          type: 'checkbox',
          name: 'unlock_children',
          placeholder: helptext.unlock_children_placeholder,
          tooltip: helptext.unlock_children_tooltip,
          width: '30%',
        },
        {
          type: 'checkbox',
          name: 'restart_services',
          placeholder: helptext.restart_services_placeholder,
          tooltip: helptext.restart_services_tooltip,
          width: '30%',
        },
        {
          type: 'upload',
          name: 'key_file',
          placeholder: helptext.upload_key_file_placeholder,
          tooltip: helptext.upload_key_file_tooltip,
          message: this.messageService,
          width: '100%'
        }
      ]
    },
    {
      name: 'top_divider',
      divider: true
    },
    {
      name: 'encrypted_roots',
      label: false,
      class: 'encrypted_roots',
      config: [
        {
          type: 'list',
          name: 'datasets',
          placeholder: '',
          templateListField: [
            {
              type: 'input',
              name: 'name',
              placeholder: '',
              isHidden: true,
            },
            {
              type: 'paragraph',
              name: 'name_text',
              paraText: '',
            },
            {
              type: 'textarea',
              name: 'key',
              placeholder: helptext.dataset_key_placeholder,
              tooltip: helptext.dataset_key_tooltip,
            },
            {
              type: 'input',
              name: 'passphrase',
              placeholder: helptext.dataset_passphrase_placeholder,
              tooltip: helptext.dataset_passphrase_tooltip,
              inputType: 'password'
            },
          ],
          listFields: []
        }
      ]
    },
    {
      name: 'encrypted_roots_divider',
      divider: true
    },
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected aroute: ActivatedRoute, protected messageService: MessageService,
              protected ws: WebSocketService,
              protected storageService: StorageService, protected dialogService: DialogService,
              protected loader: AppLoaderService, protected dialog: MatDialog) {}

  preInit(entityEdit: any) {
  }

  afterInit(entityEdit: any) {

  }

  resourceTransformIncomingRestData(data) {
  }


  ngOnDestroy() {

  }

  beforeSubmit(data) {

  }

  async customSubmit(body) {

  }

}

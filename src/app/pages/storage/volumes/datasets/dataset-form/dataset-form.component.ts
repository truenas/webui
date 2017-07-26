import { ApplicationRef, Component, OnInit, ViewContainerRef } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {FormArray, FormGroup} from '@angular/forms';
import {Subscription} from 'rxjs';

import * as _ from 'lodash';
import {GlobalState} from '../../../../../global.state';
import {RestService, WebSocketService} from '../../../../../services/';
import {EntityEditComponent} from '../../../../common/entity/entity-edit/';
import {EntityFormComponent} from '../../../../common/entity/entity-form';
import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';
import { EntityFormService } from '../../../../common/entity/entity-form/services/entity-form.service';

@Component({
  selector : 'app-dataset-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class DatasetFormComponent {

  protected pk: any;
  protected volid: string;
  protected parent: string;
  public sub: Subscription;
  protected route_success: string[] = [ 'storage', 'volumes' ];
  protected isEntity: boolean = true;

  get resource_name(): string {
    return 'storage/dataset/' + this.parent;
  }

  public fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'name',
      placeholder: 'Name',
    },
    {
      type: 'input',
      name: 'comments',
      placeholder: 'Comments',
    },
    {
      type: 'select',
      name: 'compression',
      placeholder: 'Compression level',
      options: [],
    },
    {
      type: 'select',
      name: 'share_type',
      placeholder: 'Share type',
      options: [],
    },
    {
      type: 'select',
      name: 'atime',
      placeholder: 'Enable atime',
      options: [],
    },
    {
      type: 'select',
      name: 'dedup',
      placeholder: 'ZFS Deduplication',
      options: [],
    },
    {
      type: 'select',
      name: 'case_sensitivity',
      placeholder: 'Case Sensitivity',
      options: [],
    }
  ];

  protected compression_field: any;
  protected share_type_control: any;
  protected atime_field: any;
  protected dedup_field: any;
  protected case_sensitivity_field: any;

  constructor(protected router: Router, protected aroute: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService) {}

  clean_name(value) {
    let start = this.pk.split('/').splice(1).join('/');
    if (start != '') {
      return start + '/' + value;
    } else {
      return value;
    }
  }

  preInit() {
    this.sub = this.aroute.params.subscribe(params => {
      this.volid = params['volid'];
      if(params['pk']) {
        this.pk = params['pk'];
        console.log('pk exist',this.pk);
      } else {
        this.pk = '';
      }
      if (params['parent']) {
        this.parent = params['parent'];
      } else {
        this.parent = '';
      }
      
    });
  }

  afterInit(entityForm: any) {
    this.ws.call('notifier.choices', [ 'ZFS_CompressionChoices' ]).subscribe((res) => {
      this.compression_field = _.find(this.fieldConfig, {name: 'compression'});
      for (let item of res) {
        this.compression_field.options.push({label: item[1], value: item[0]});
      }
    });

    this.ws.call('notifier.choices', [ 'SHARE_TYPE_CHOICES' ]).subscribe((res) => {
      this.share_type_control = _.find(this.fieldConfig, {name: 'share_type'});
      for (let item of res) {
        this.share_type_control.options.push({label: item[1], value: item[0]});
      }
    });

    this.ws.call('notifier.choices', [ 'ZFS_AtimeChoices' ]).subscribe((res) => {
      this.atime_field = _.find(this.fieldConfig, {name: 'atime'});
      for (let item of res) {
        this.atime_field.options.push({label: item[1], value: item[0]});
      }
    });

    this.ws.call('notifier.choices', [ 'ZFS_DEDUP' ]).subscribe((res) => {
      this.dedup_field = _.find(this.fieldConfig, {name: 'dedup'});
      for (let item of res) {
        this.dedup_field.options.push({label: item[1], value: item[0]});
      }
    });

    this.ws.call('notifier.choices', [ 'CASE_SENSITIVITY_CHOICES' ]).subscribe((res) => {
      this.case_sensitivity_field = _.find(this.fieldConfig, {name: 'case_sensitivity'});
      for (let item of res) {
        this.case_sensitivity_field.options.push({label: item[1], value: item[0]});
      }
    });

    if (!entityForm.isNew) {
      entityForm.setDisabled('name', true);
    }
  }
}

import { Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import * as _ from 'lodash';

import {
  AppLoaderService, WebSocketService, DialogService, JailService,
} from 'app/services';
import { EntityUtils } from '../../../common/entity/utils';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { T } from 'app/translate-marker';
import helptext from 'app/helptext/jails/storage';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

interface MountPoint {
  action: string;
  source: string;
  destination: string;
  fstype: string;
  fsoptions: string;
  dump: string;
  pass: string;
  index?: string;
}

@UntilDestroy()
@Component({
  selector: 'app-storage-add',
  template: '<entity-form *ngIf="isReady" [conf]="this"></entity-form>',
})
export class StorageFormComponent implements FormConfiguration, OnInit {
  queryCall: 'jail.fstab' = 'jail.fstab';
  route_success: string[] = ['jails', 'storage'];
  isEntity = true;
  pk: string;
  protected mountpointId: string;
  queryCallOption: any;
  protected mountPointAdd: MountPoint = {
    action: 'ADD',
    source: '',
    destination: '',
    fstype: '',
    fsoptions: '',
    dump: '',
    pass: '',
  };
  protected mountPointEdit: MountPoint = {
    action: 'REPLACE',
    source: '',
    destination: '',
    fstype: '',
    fsoptions: '',
    dump: '',
    pass: '',
  };
  fieldConfig: FieldConfig[] = [{
    type: 'select',
    name: 'jail',
    placeholder: helptext.jail_placeholder,
    options: [],
    disabled: false,
  },
  {
    type: 'explorer',
    initial: '/mnt',
    explorerType: 'directory',
    name: 'source',
    placeholder: helptext.source_placeholder,
    tooltip: helptext.source_tooltip,
    disabled: false,
    required: true,
    validation: [Validators.required],
  },
  {
    type: 'explorer',
    initial: '/mnt',
    explorerType: 'directory',
    name: 'destination',
    placeholder: helptext.destination_placeholder,
    tooltip: helptext.destination_tooltip,
    disabled: false,
    rootSelectable: false,
    required: true,
    validation: [Validators.required],
  },
  {
    type: 'checkbox',
    name: 'readonly',
    placeholder: helptext.readonly_placeholder,
    tooltip: helptext.readonly_tooltip,
    disabled: false,
  },
  ];

  private jail: any;
  protected entityForm: EntityFormComponent;
  protected formGroup: any;
  protected error: any;
  protected jailID: any;

  isReady = false;
  protected mountpoint: string;
  save_button_enabled: boolean;
  constructor(protected router: Router, protected aroute: ActivatedRoute,
    protected jailService: JailService, protected loader: AppLoaderService, protected ws: WebSocketService,
    private dialog: DialogService) {}

  ngOnInit(): void {
    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.ws.call('jail.query', [
        [
          ['host_hostuuid', '=', params['jail']],
        ],
      ]).pipe(untilDestroyed(this)).subscribe((res) => {
        if (res[0] && res[0].state == 'up') {
          this.save_button_enabled = false;
          this.error = T('Mount points used in jail ' + params['jail'] + ' cannot be edited while the jail is running.');
          for (let i = 0; i < this.fieldConfig.length; i++) {
            this.fieldConfig[i].disabled = true;
          }
        } else {
          this.save_button_enabled = true;
          this.error = '';
        }
      });
    });
    this.ws.call('jail.get_activated_pool').pipe(untilDestroyed(this)).subscribe((res) => {
      if (res != null) {
        this.ws.call('zfs.dataset.query', [[['name', '=', res + '/iocage']]]).pipe(untilDestroyed(this)).subscribe(
          (res) => {
            this.mountpoint = res[0].mountpoint;
            this.isReady = true;
          },
        );
      }
    });
  }

  preInit(): void {
    const destination_field = _.find(this.fieldConfig, { name: 'destination' });
    this.jail = _.find(this.fieldConfig, { name: 'jail' });
    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.route_success.push(params['jail']);
      this.mountpointId = params['pk'];
      this.jailID = params['jail'];
      this.pk = params['jail'];
      this.queryCallOption = {
        action: 'LIST', source: '', destination: '', fstype: '', fsoptions: '', dump: '', pass: '',
      };
      if (this.jailID) {
        this.jail.value = this.jailID;
        destination_field.initial = this.mountpoint + '/jails/' + this.jailID + '/root';
      }
    });
  }

  afterInit(entityForm: EntityFormComponent): void {
    this.entityForm = entityForm;
    entityForm.onSubmit = this.onSubmit;
    entityForm.error = this.error;

    this.jailService.listJails().pipe(untilDestroyed(this)).subscribe((res: any[]) => {
      res.forEach((item) => {
        this.jail.options.push({ label: item.host_hostuuid, value: item.host_hostuuid });
      });
    });

    if (!entityForm.isNew || this.jailID) {
      entityForm.setDisabled('jail', true);
    }
  }

  dataAttributeHandler(entityList: any): void {
    entityList.formGroup.controls['source'].setValue(entityList.queryResponse[this.mountpointId].entry[0]);
    entityList.formGroup.controls['destination'].setValue(entityList.queryResponse[this.mountpointId].entry[1]);

    if (entityList.queryResponse[this.mountpointId].entry[3] == 'ro') {
      entityList.formGroup.controls['readonly'].setValue(true);
    } else if (entityList.queryResponse[this.mountpointId].entry[3] == 'rw') {
      entityList.formGroup.controls['readonly'].setValue(false);
    }

    this.mountPointEdit.source = entityList.queryResponse[this.mountpointId].entry[0];
    this.mountPointEdit.destination = entityList.queryResponse[this.mountpointId].entry[1];
    this.mountPointEdit.fstype = entityList.queryResponse[this.mountpointId].entry[2];
    this.mountPointEdit.fsoptions = entityList.queryResponse[this.mountpointId].entry[3];
    this.mountPointEdit.dump = entityList.queryResponse[this.mountpointId].entry[4];
    this.mountPointEdit.pass = entityList.queryResponse[this.mountpointId].entry[5];
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.error = null;
    const value = _.cloneDeep(this.formGroup.value);
    let mountPoint: MountPoint;

    const destination_field = _.find(this.fieldConfig, { name: 'destination' });
    if (_.startsWith(value['destination'], destination_field.initial)) {
      value['destination'] = value['destination'].substring(destination_field.initial.length);
    }

    if (this.mountpointId) {
      // edit mode
      this.mountPointEdit.source = value['source'];
      this.mountPointEdit.destination = value['destination'];
      this.mountPointEdit.index = this.mountpointId;
      if (value['readonly']) {
        this.mountPointEdit.fsoptions = 'ro';
      } else {
        this.mountPointEdit.fsoptions = 'rw';
      }
      mountPoint = this.mountPointEdit;
    } else {
      // add mode
      this.mountPointAdd.source = value['source'];
      this.mountPointAdd.destination = value['destination'];
      this.mountPointAdd.fstype = 'nullfs';
      if (value['readonly']) {
        this.mountPointAdd.fsoptions = 'ro';
      } else {
        this.mountPointAdd.fsoptions = 'rw';
      }
      this.mountPointAdd.dump = '0';
      this.mountPointAdd.pass = '0';
      mountPoint = this.mountPointAdd;
    }

    this.loader.open();
    this.ws.call('jail.fstab', [this.jailID, mountPoint]).pipe(untilDestroyed(this)).subscribe(
      () => {
        this.loader.close();
        this.router.navigate(new Array('/').concat(this.route_success));
      },
      (res) => {
        this.loader.close();
        new EntityUtils().handleWSError(this, res);
      },
    );
  }
}

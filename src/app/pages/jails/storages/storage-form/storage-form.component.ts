import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';

import { EntityFormComponent } from '../../../common/entity/entity-form';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { WebSocketService } from '../../../../services/';
import { DialogService } from '../../../../services/';

import { JailService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector: 'app-storage-add',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class StorageFormComponent {

  protected addCall = 'jail.fstab';
  protected route_success: string[] = ['jails', 'storage'];
  protected isEntity: boolean = true;

  public fieldConfig: FieldConfig[] = [{
      type: 'select',
      name: 'jail',
      placeholder: 'Jail',
      options: [],
    },
    {
      type: 'explorer',
      initial: '/mnt',
      name: 'source',
      placeholder: 'Source',
    },
    {
      // type: 'explorer',
      // initial: '/mnt/iocage/jails/test6/root',
      type: 'input',
      name: 'destination',
      placeholder: 'Destination',
    }
  ];

  private jail: any;
  protected entityForm: any;
  protected formGroup: any;
  protected error: any;
  protected jailID: any;
  constructor(protected router: Router, protected aroute: ActivatedRoute,
    protected jailService: JailService, protected loader: AppLoaderService, protected ws: WebSocketService,
    private dialog: DialogService) {}

  preInit(entityForm: any) {
    this.jail = _.find(this.fieldConfig, { 'name': 'jail' });
    this.aroute.params.subscribe(params => {
      this.route_success.push(params['jail']);
      this.jailID = params['jail'];
      if(this.jailID) {
        this.jail.value = this.jailID;
      }
    });
  }

  afterInit(entityForm: any) {
    this.entityForm = entityForm;
    entityForm.onSubmit = this.onSubmit;
    entityForm.error = this.error;
    entityForm.route_success = this.route_success;
    entityForm.jailID = this.jailID;

    this.jailService.listJails().subscribe((res) => {
      res.forEach((item) => {
        this.jail.options.push({ label: item.host_hostuuid, value: item.host_hostuuid });
      });
    });

    if (!entityForm.isNew || this.jailID) {
      entityForm.setDisabled('jail', true);
    }
  }

  onSubmit(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.error = null;
    let value = _.cloneDeep(this.formGroup.value);

    let jail = this.jailID;

    value['action'] = "ADD";
    value['fstype'] = "nullfs";
    value['fsoptions'] = "ro";
    value['dump'] = "0";
    value['pass'] = "0";

    this.loader.open();
    this.ws.call('jail.fstab', [jail, value]).subscribe(
      (res) => {
        this.loader.close();
        this.router.navigate(new Array('/').concat(this.route_success));
      },
      (res) => {
        this.loader.close();
        this.dialog.errorReport(res.error, res.reason, res.trace.formatted);
      }
    );
  }
}

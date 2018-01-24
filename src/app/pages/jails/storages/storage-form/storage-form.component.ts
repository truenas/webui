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

interface MountPoint {
  action: string,
  source: string,
  destination: string,
  fstype: string,
  fsoptions: string,
  dump: string,
  pass: string,
  index ? : string,
}
@Component({
  selector: 'app-storage-add',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class StorageFormComponent {

  protected queryCall = "jail.fstab";
  protected route_success: string[] = ['jails', 'storage'];
  protected isEntity: boolean = true;
  protected pk: string;
  protected mountpointId: string;
  protected queryCallOption: any;
  protected mountPointAdd: MountPoint = {
    action: "ADD",
    source: "",
    destination: "",
    fstype: "",
    fsoptions: "",
    dump: "",
    pass: "",
  };
  protected mountPointEdit: MountPoint = {
    action: "REPLACE",
    source: "",
    destination: "",
    fstype: "",
    fsoptions: "",
    dump: "",
    pass: "",
  };
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
      tooltip: 'Directory or dataset on the FreeNAS system which will\
 be accessed by the jail. This directory <b>must</b> reside outside of\
 the volume or dataset being used by the jail.',
    },
    {
      // type: 'explorer',
      // initial: '/mnt/iocage/jails/test6/root',
      type: 'input',
      name: 'destination',
      placeholder: 'Destination',
      tooltip: 'Select an existing, empty directory within the\
 jail to link to the <b>Source</b> storage area. If that directory does\
 not exist yet, enter the desired directory name and check the\
 <b>Create directory</b> box.',
    },
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
      this.mountpointId = params['pk'];
      this.jailID = params['jail'];
      this.pk = params['jail'];
      this.queryCallOption = { "action": "LIST", "source": "", "destination": "", "fstype": "", "fsoptions": "", "dump": "", "pass": "" };
      if (this.jailID) {
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
    entityForm.mountPointEdit = this.mountPointEdit;
    entityForm.mountPointAdd = this.mountPointAdd;
    entityForm.mountpointId = this.mountpointId;

    this.jailService.listJails().subscribe((res) => {
      res.forEach((item) => {
        this.jail.options.push({ label: item.host_hostuuid, value: item.host_hostuuid });
      });
    });

    if (!entityForm.isNew || this.jailID) {
      entityForm.setDisabled('jail', true);
    }
  }

  dataAttributeHandler(entityList: any) {
    entityList.formGroup.controls['source'].setValue(entityList.queryResponse[this.mountpointId][0]);
    entityList.formGroup.controls['destination'].setValue(entityList.queryResponse[this.mountpointId][1]);

    this.mountPointEdit.source = entityList.queryResponse[this.mountpointId][0];
    this.mountPointEdit.destination = entityList.queryResponse[this.mountpointId][1];
    this.mountPointEdit.fstype = entityList.queryResponse[this.mountpointId][2];
    this.mountPointEdit.fsoptions = entityList.queryResponse[this.mountpointId][3];
    this.mountPointEdit.dump = entityList.queryResponse[this.mountpointId][4];
    this.mountPointEdit.pass = entityList.queryResponse[this.mountpointId][5];
  }

  onSubmit(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.error = null;
    let value = _.cloneDeep(this.formGroup.value);
    let mountPoint: MountPoint;

    if (this.mountpointId) {
      //edit mode
      this.mountPointEdit.source = value['source'];
      this.mountPointEdit.destination = value['destination'];
      this.mountPointEdit.index = this.mountpointId;
      mountPoint = this.mountPointEdit;
    } else {
      // add mode
      this.mountPointAdd.source = value['source'];
      this.mountPointAdd.destination = value['destination'];
      this.mountPointAdd.fstype = "nullfs";
      this.mountPointAdd.fsoptions = "ro";
      this.mountPointAdd.dump = "0";
      this.mountPointAdd.pass = "0";
      mountPoint = this.mountPointAdd;
    }

    this.loader.open();
    this.ws.call('jail.fstab', [this.jailID, mountPoint]).subscribe(
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

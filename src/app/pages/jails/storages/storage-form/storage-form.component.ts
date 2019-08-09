import { Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';

import { AppLoaderService, WebSocketService, DialogService, JailService } from '../../../../services/';
import { EntityUtils } from '../../../common/entity/utils';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { T } from '../../../../translate-marker'
import helptext from '../../../../helptext/jails/storage';

interface MountPoint {
  action: string,
  source: string,
  destination: string,
  fstype: string,
  fsoptions: string,
  dump: string,
  pass: string,
  index ?: string,
}
@Component({
  selector: 'app-storage-add',
  template: `<entity-form *ngIf="isReady" [conf]="this"></entity-form>`
})
export class StorageFormComponent implements OnInit{

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
      validation: [ Validators.required ]
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
      validation: [ Validators.required ]
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
  protected entityForm: any;
  protected formGroup: any;
  protected error: any;
  protected jailID: any;

  public isReady: boolean = false;
  protected mountpoint: string;
  protected save_button_enabled: boolean;
  constructor(protected router: Router, protected aroute: ActivatedRoute,
    protected jailService: JailService, protected loader: AppLoaderService, protected ws: WebSocketService,
    private dialog: DialogService) {}

  ngOnInit() {
    this.aroute.params.subscribe(params => {
      this.ws.call('jail.query', [
        [
          ["host_hostuuid", "=", params['jail']]
        ]
      ]).subscribe((res) => {
        if (res[0] && res[0].state == 'up') {
          this.save_button_enabled = false;
          this.error = T("Mount points used in jail " + params['jail'] + " cannot be edited while the jail is running.");
          for (let i = 0; i < this.fieldConfig.length; i++) {
            this.fieldConfig[i].disabled = true;
          }
        } else {
          this.save_button_enabled = true;
          this.error = "";
        }
      });
    });
    this.ws.call('jail.get_activated_pool').subscribe((res)=>{
          if (res != null) {
            this.ws.call('zfs.dataset.query', [[["name", "=", res+"/iocage"]]]).subscribe(
              (res)=> {
                this.mountpoint = res[0].mountpoint;
                this.isReady = true;
              });
          }
    });
  }

  preInit(entityForm: any) {
    let destination_field = _.find(this.fieldConfig, { 'name': 'destination' });
    this.jail = _.find(this.fieldConfig, { 'name': 'jail' });
    this.aroute.params.subscribe(params => {
      this.route_success.push(params['jail']);
      this.mountpointId = params['pk'];
      this.jailID = params['jail'];
      this.pk = params['jail'];
      this.queryCallOption = { "action": "LIST", "source": "", "destination": "", "fstype": "", "fsoptions": "", "dump": "", "pass": "" };
      if (this.jailID) {
        this.jail.value = this.jailID;
        destination_field.initial = this.mountpoint + '/jails/' + this.jailID + '/root';
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

  onSubmit(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.error = null;
    let value = _.cloneDeep(this.formGroup.value);
    let mountPoint: MountPoint;

    let destination_field = _.find(this.fieldConfig, { 'name': 'destination' });
    if (_.startsWith(value['destination'], destination_field.initial)) {
      value['destination'] = value['destination'].substring(destination_field.initial.length);
    }

    if (this.mountpointId) {
      //edit mode
      this.mountPointEdit.source = value['source'];
      this.mountPointEdit.destination = value['destination'];
      this.mountPointEdit.index = this.mountpointId;
      if (value['readonly']) {
        this.mountPointEdit.fsoptions = "ro";
      } else {
        this.mountPointEdit.fsoptions = "rw";
      }
      mountPoint = this.mountPointEdit;
    } else {
      // add mode
      this.mountPointAdd.source = value['source'];
      this.mountPointAdd.destination = value['destination'];
      this.mountPointAdd.fstype = "nullfs";
      if (value['readonly']) {
        this.mountPointAdd.fsoptions = "ro";
      } else {
        this.mountPointAdd.fsoptions = "rw";
      }
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
        new EntityUtils().handleWSError(this, res);
      }
    );
  }
}

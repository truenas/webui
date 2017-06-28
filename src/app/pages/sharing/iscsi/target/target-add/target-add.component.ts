import { ApplicationRef, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { FormGroup, FormArray } from '@angular/forms';
import { Router } from '@angular/router';

import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicSelectModel, DynamicRadioGroupModel, DynamicTextAreaModel, DynamicFormArrayModel, DynamicFormArrayGroupModel } from '@ng2-dynamic-forms/core';
import { GlobalState } from '../../../../../global.state';
import { RestService, WebSocketService, IscsiService } from '../../../../../services/';

import { Subscription } from 'rxjs';
import { EntityUtils } from '../../../../common/entity/utils';

@Component({
  selector: 'app-iscsi-target-add',
  templateUrl: './target-add.component.html',
  providers: [IscsiService],
})
export class TargetAddComponent implements OnInit{

  public target_resource_name: string = 'services/iscsi/target';
  public targetgroup_resource_name: string = 'services/iscsi/targetgroup';
  public route_success: string[] = ['sharing', 'iscsi'];
  public pk: any;
  public iscsi_group_count: number = 1;
  public formGroup: FormGroup;
  public arrayControl: FormArray;
  public arrayModel: DynamicFormArrayModel;
  public error: string;
  public busy: Subscription;

  public formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
      id: 'iscsi_target_name',
      label: 'Target Name',
    }),
    new DynamicInputModel({
      id: 'iscsi_target_alias',
      label: 'Target Alias',
    }),
    new DynamicFormArrayModel({
      id: "iscsi_target_group",
      initialCount: 1,
      createGroup: () => {
        return [
          new DynamicSelectModel({
            id: 'iscsi_target_portalgroup',
            label: 'Portal Group ID',
            value: '',
          }),
          new DynamicSelectModel({
            id: 'iscsi_target_initiatorgroup',
            label: 'Initiator Group ID',
            value: '',
          }),
          new DynamicSelectModel({
            id: 'iscsi_target_authtype',
            label: 'Auth Method',
            value: 'None',
            options: [
              {
                label: 'None',
                value: 'None',
              },
              {
                label: 'CHAP',
                value: 'CHAP',
              },
              {
                label: 'Mutual CHAP',
                value: 'CHAP Mutual',
              }
            ]
          }),
          new DynamicSelectModel({
            id: 'iscsi_target_authgroup',
            label: 'Authentication Group number',
            value: '',
          }),
        ];
      }
    })
  ];

  public custActions: Array<any> = [
    {
      id: 'add_extra_iscsi_group',
      name: 'Add Extra ISCSI Group',
      function: () => {
        this.iscsi_group_count += 1;
        this.formService.insertFormArrayGroup(this.iscsi_group_count, this.arrayControl ,this.arrayModel)
        this.setFormArray(this.arrayModel.groups[this.iscsi_group_count-1], 0);
        this.setFormArray(this.arrayModel.groups[this.iscsi_group_count-1], 1);
        this.setFormArray(this.arrayModel.groups[this.iscsi_group_count-1], 3);
      }
    },
    {
      id: 'remove_extra_iscsi_group',
      name: 'Remove Extra ISCSI Group',
      function: () => {
        this.iscsi_group_count -= 1;
        this.formService.removeFormArrayGroup(this.iscsi_group_count, this.arrayControl ,this.arrayModel)
      }
    },
  ];

  private portalGroupID: DynamicSelectModel<string>;
  protected portals: any;
  private initiatorGroupID: DynamicSelectModel<string>;
  protected initiators: any;
  private authGroupID: DynamicSelectModel<string>;
  protected auths: any;
  constructor(protected router: Router, protected rest: RestService, protected ws: WebSocketService, protected formService: DynamicFormService, protected _injector: Injector, protected _appRef: ApplicationRef, protected _state: GlobalState, protected iscsiService: IscsiService) {

  }

  ngOnInit() {
    this.formGroup = this.formService.createFormGroup(this.formModel);
    this.arrayControl = <FormArray> this.formGroup.get("iscsi_target_group");
    this.arrayModel = <DynamicFormArrayModel> this.formService.findById("iscsi_target_group", this.formModel);

    this.iscsiService.listPortals().subscribe((res) => {
      this.portals = res.data;
      for(let i in this.arrayModel.groups) {
        this.setFormArray(this.arrayModel.groups[i], 0);
      }
    });
    this.iscsiService.listInitiators().subscribe((res) => {
      this.initiators = res.data;
      for(let i in this.arrayModel.groups) {
        this.setFormArray(this.arrayModel.groups[i], 1);
      }
    });
    this.iscsiService.listAuthCredential().subscribe((res) => {
      this.auths = res.data;
      for(let i in this.arrayModel.groups) {
        this.setFormArray(this.arrayModel.groups[i], 3);
      }
    });
  }

  isCustActionVisible(actionId: string) {
    if (actionId == 'remove_extra_iscsi_group' && this.iscsi_group_count <= 1) {
      return false;
    }
    return true;
  }

  setFormArray(groupModel: DynamicFormArrayGroupModel, index: number) {
    if (index == 0) {
      this.portalGroupID = <DynamicSelectModel<string>>groupModel.group[index];
      this.portalGroupID.add({ label: 'None', value: '' });
      this.portals.forEach((item, i) => {
        var label = item.iscsi_target_portal_tag + ' (' + item.iscsi_target_portal_comment + ')';
        this.portalGroupID.add({ label: label, value: i+1 })
      });
    } else if (index == 1) {
      this.initiatorGroupID = <DynamicSelectModel<string>>groupModel.group[index];
      this.initiatorGroupID.add({ label: 'None', value: '' });
      this.initiators.forEach((item, i) => {
        var label = item.iscsi_target_initiator_tag + ' (' + item.iscsi_target_initiator_comment + ')';
        this.initiatorGroupID.add({ label: label, value: i+1 })
      });
    } else if (index == 3) {
      this.authGroupID = <DynamicSelectModel<string>>groupModel.group[index];
      this.authGroupID.add({ label: 'None', value: '' });
      this.auths.forEach((item) => {
        this.authGroupID.add({ label: item.iscsi_target_auth_tag, value: item.iscsi_target_auth_tag })
      });
    }
  }

  goBack() {
    this.router.navigate(new Array('/pages').concat(this.route_success));
  }

  onSubmit() {
    this.error = null;
    
    let target_value: any = {};
    let iscsi_group_value: any;
    let value = this.formGroup.value;

    iscsi_group_value = this.formGroup.value['iscsi_target_group'];
    target_value.iscsi_target_name = this.formGroup.value['iscsi_target_name'];
    target_value.iscsi_target_alias = this.formGroup.value['iscsi_target_alias'];

    this.busy = this.rest.post(this.target_resource_name + '/', {
      body: JSON.stringify(target_value),
    }).subscribe((res) => {
      let target_id = res.data.id;

      for(let i in iscsi_group_value) {
        iscsi_group_value[i].iscsi_target = target_id;
        this.rest.post(this.targetgroup_resource_name + '/', {
          body: JSON.stringify(iscsi_group_value[i]),
        }).subscribe((res) => {
          console.log(res.data);
        }, (res) => {
          let data = {};
          this.rest.delete(this.target_resource_name + '/' + target_id, data).subscribe((res) => {
            this.error = 'Create Target failed';
          }, (res) => {
            new EntityUtils().handleError(this, res);
          });
          new EntityUtils().handleError(this, res);
        });
      }

      this.router.navigate(new Array('/pages').concat(this.route_success));
    }, (res) => {
      new EntityUtils().handleError(this, res);
    });
  }
}


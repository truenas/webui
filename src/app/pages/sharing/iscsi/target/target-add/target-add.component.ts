import { Component, OnInit } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

import { IscsiService, RestService } from '../../../../../services/';
import { EntityUtils } from '../../../../common/entity/utils';

import { DynamicFieldDirective } from '../../../../common/entity/entity-form/components/dynamic-field/dynamic-field.directive';
import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';
import { EntityFormService } from '../../../../common/entity/entity-form/services/entity-form.service';

@Component({
  selector : 'app-iscsi-target-add',
  templateUrl : './target-add.component.html',
  providers : [ IscsiService, EntityFormService ],
})
export class TargetAddComponent implements OnInit {

  public target_resource_name: string = 'services/iscsi/target';
  public targetgroup_resource_name: string = 'services/iscsi/targetgroup';
  public route_success: string[] = [ 'sharing', 'iscsi', 'target' ];

  public iscsi_group_count: number = 1;
  public formGroup: any;
  public arrayControl: any;
  public arrayModel: any;
  public error: string;
  public busy: Subscription;

  public fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name : 'iscsi_target_name',
      placeholder : 'Target Name',
    },
    {
      type: 'input',
      name : 'iscsi_target_alias',
      placeholder : 'Target Alias',
    },
    {
      type: 'array',
      name : "iscsi_target_group",
      initialCount : 1,
      formarray : [
          {
            type: 'select',
            name : 'iscsi_target_portalgroup',
            placeholder : 'Portal Group ID',
            value : '',
            options: [],
          },
          {
            type: 'select',
            name : 'iscsi_target_initiatorgroup',
            placeholder : 'Initiator Group ID',
            value : '',
            options: [],
          },
          {
            type: 'select',
            name : 'iscsi_target_authtype',
            placeholder : 'Auth Method',
            value : 'None',
            options : [
              {
                label : 'None',
                value : 'None',
              },
              {
                label : 'CHAP',
                value : 'CHAP',
              },
              {
                label : 'Mutual CHAP',
                value : 'CHAP Mutual',
              }
            ],
          },
          {
            type: 'select',
            name : 'iscsi_target_authgroup',
            placeholder : 'Authentication Group number',
            value : '',
            options: [],
          },
        ]
    }
  ];

  public custActions: Array<any> = [
    {
      id : 'add_extra_iscsi_group',
      name : 'Add Extra ISCSI Group',
      function : () => {
        this.iscsi_group_count += 1;
        this.entityFormService.insertFormArrayGroup(this.iscsi_group_count, this.formArray, this.arrayControl.formarray);
      }
    },
    {
      id : 'remove_extra_iscsi_group',
      name : 'Remove Extra ISCSI Group',
      function : () => {
        this.iscsi_group_count -= 1;
        this.entityFormService.removeFormArrayGroup(this.iscsi_group_count, this.formArray);
      }
    },
  ];

  protected portals: any;
  protected initiators: any;
  protected auths: any;
  protected formArray: any;
  constructor(protected router: Router,
              protected rest: RestService,
              protected iscsiService: IscsiService,
              protected entityFormService: EntityFormService) {}

  ngOnInit() {
    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);
    this.formArray = this.formGroup.controls['iscsi_target_group'];
    this.arrayControl = _.find(this.fieldConfig,{'name' : 'iscsi_target_group'});

    this.iscsiService.listPortals().subscribe((res) => {
      this.portals = res.data;
      this.setFormArray(this.arrayControl.formarray[0]);
    });
    this.iscsiService.listInitiators().subscribe((res) => {
      this.initiators = res.data;
      this.setFormArray(this.arrayControl.formarray[1]);
    });
    this.iscsiService.listAuthCredential().subscribe((res) => {
      this.auths = res.data;
      this.setFormArray(this.arrayControl.formarray[3]);
    });
  }

  isCustActionVisible(actionId: string) {
    if (actionId == 'remove_extra_iscsi_group' && this.iscsi_group_count <= 1) {
      return false;
    }
    return true;
  }

  setFormArray(groupModel: any) {
    if(groupModel.name == 'iscsi_target_portalgroup') {
      groupModel.options.push({label : 'None', value : ''});
      this.portals.forEach((item, i) => {
        var label = item.iscsi_target_portal_tag;
        if (item.iscsi_target_portal_comment) {
          label = item.iscsi_target_portal_tag + ' (' + item.iscsi_target_portal_comment + ')';
        }
        groupModel.options.push({label : label, value : i + 1})
      });
    } else if (groupModel.name == 'iscsi_target_initiatorgroup') {
      groupModel.options.push({label : 'None', value : ''});
      this.initiators.forEach((item, i) => {
        var label = item.iscsi_target_initiator_tag;
        if (item.iscsi_target_initiator_comment) {
          label = item.iscsi_target_initiator_tag + ' (' + item.iscsi_target_initiator_comment + ')';
        }
        groupModel.options.push({label : label, value : i + 1})
      });
    } else if (groupModel.name == 'iscsi_target_authgroup') {
      groupModel.options.push({label : 'None', value : ''});
      this.auths.forEach((item) => {
        groupModel.options.push(
          {
            label : item.iscsi_target_auth_tag,
            value : item.iscsi_target_auth_tag
          }
        )
      });
    }
  }

  goBack() {
    this.router.navigate(new Array('').concat(this.route_success));
  }

  onSubmit() {
    this.error = null;

    let target_value: any = {};
    let iscsi_group_value: any;
    let value = this.formGroup.value;

    iscsi_group_value = this.formGroup.value['iscsi_target_group'];
    target_value.iscsi_target_name = this.formGroup.value['iscsi_target_name'];
    target_value.iscsi_target_alias = this.formGroup.value['iscsi_target_alias'];

    this.busy = this.rest
        .post(this.target_resource_name + '/', {
          body : JSON.stringify(target_value),
        })
        .subscribe(
          (res) => {
            let target_id = res.data.id;

            for (let i in iscsi_group_value) {
              iscsi_group_value[i].iscsi_target = target_id;
              this.rest
                  .post(this.targetgroup_resource_name + '/', {
                    body : JSON.stringify(iscsi_group_value[i]),
                  })
                  .subscribe(
                    (res) => { console.log(res.data); },
                    (res) => {
                     let data = {};
                     this.rest
                         .delete(this.target_resource_name + '/' + target_id, data)
                         .subscribe(
                             (res) => {
                               this.error = 'Create Target failed';
                             },
                             (res) => {
                               new EntityUtils().handleError(this, res);
                             });
                     new EntityUtils().handleError(this, res);
                    });
            }

            this.router.navigate(new Array('').concat(this.route_success));
          },
          (res) => {
            new EntityUtils().handleError(this, res);
          }
        );
  }
}

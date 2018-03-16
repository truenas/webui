import { Component, OnInit } from '@angular/core';
import { FormArray, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

import { IscsiService, RestService } from '../../../../../services/';
import { EntityUtils } from '../../../../common/entity/utils';

import { DynamicFieldDirective } from '../../../../common/entity/entity-form/components/dynamic-field/dynamic-field.directive';
import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';
import { EntityFormService } from '../../../../common/entity/entity-form/services/entity-form.service';
import { AppLoaderService } from '../../../../../services/app-loader/app-loader.service';
import { T } from '../../../../../translate-marker';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector : 'app-iscsi-target-edit',
  templateUrl : './target-edit.component.html',
  styleUrls: ['./target-edit.component.css'],
  providers : [ IscsiService, EntityFormService ],
})
export class TargetEditComponent implements OnInit {

  public target_resource_name: string = 'services/iscsi/target/';
  public targetgroup_resource_name: string = 'services/iscsi/targetgroup/';
  public route_success: string[] = [ 'sharing', 'iscsi', 'target' ];

  public pk: any;
  protected initialCount: number = 0;
  protected initialCount_default: number = 0;

  public formGroup: any;
  public arrayControl: any;
  public arrayModel: any;
  protected target_id: any;

  public error: string;
  public busy: Subscription;
  public sub: any;

  public fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name : 'iscsi_target_name',
      placeholder : T('Target Name'),
      tooltip: T('Required value. Base name will be appended\
 automatically if it does not start with <i>iqn</i>.'),
      required: true,
      validation: [Validators.required],
    },
    {
      type: 'input',
      name : 'iscsi_target_alias',
      placeholder : T('Target Alias'),
      tooltip: T('Optional user-friendly name.'),
    },
    {
      type: 'array',
      name : "iscsi_target_group",
      initialCount : 0,
      formarray : [
        {
          type: 'select',
          name : 'iscsi_target_portalgroup',
          placeholder : T('Portal Group ID'),
          tooltip: T('Leave empty or select number of existing portal\
 to use.'),
          value : '',
          options: [],
          required: true,
          validation: [Validators.required],
        },
        {
          type: 'select',
          name : 'iscsi_target_initiatorgroup',
          placeholder : T('Initiator Group ID'),
          tooltip: T('Select which existing initiator group has access\
 to the target.'),
          value : '',
          options: [],
        },
        {
          type: 'select',
          name : 'iscsi_target_authtype',
          placeholder : T('Auth Method'),
          tooltip: T('Choices are <i>None, Auto, CHAP,</i> or\
 <i>Mutual CHAP</i>.'),
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
          placeholder : T('Authentication Group number'),
          tooltip: T('<i>None</i> or integer representing number of\
 existing authorized access.'),
          value : '',
          options: [],
        },
        {
          type: 'input',
          name: 'id',
          placeholder: T('Group ID'),
          isHidden: true,
        },
        {
          type: 'checkbox',
          name: 'delete',
          placeholder: T('Delete'),
        },
      ]
    }
  ];

  public custActions: Array<any> = [
    {
      id : 'add_extra_iscsi_group',
      name : 'Add Extra ISCSI Group',
      function : () => {
        this.initialCount += 1;
        this.entityFormService.insertFormArrayGroup(this.initialCount, this.formArray, this.arrayControl.formarray);
      }
    },
    {
      id : 'remove_extra_iscsi_group',
      name : 'Remove Extra ISCSI Group',
      function : () => {
        this.initialCount -= 1;
        this.entityFormService.removeFormArrayGroup(this.initialCount, this.formArray);
      }
    },
  ];

  protected portals: any;
  protected initiators: any;
  protected auths: any;
  protected formArray: any;
  constructor(protected router: Router,
              protected route: ActivatedRoute,
              protected rest: RestService,
              protected iscsiService: IscsiService,
              protected entityFormService: EntityFormService,
              protected loader: AppLoaderService,
              public translate: TranslateService) {}

  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      this.pk = params['pk'];
      this.target_resource_name = this.target_resource_name + this.pk + '/';

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

      this.rest.get(this.target_resource_name, {}).subscribe((res) => {
        this.target_id = res.data['id'];
        for (let i in res.data) {
          let fg = this.formGroup.controls[i];
          if (fg) {
            fg.setValue(res.data[i]);
          }
        }
        this.iscsiService.listTargetGroups().subscribe((res) => {
          for (let i in res.data) {
            let group = res.data[i];
            if (group.iscsi_target == this.target_id) {
              this.initialCount += 1;
              this.initialCount_default += 1;

              let formGroup = this.entityFormService.createFormGroup(this.arrayControl.formarray);
              for (let i in group) {
                let formControl = formGroup.controls[i];
                if (formControl) {
                  formControl.setValue(group[i]);
                }
              }
              this.formArray.insert(this.initialCount, formGroup);
            }
          }
        });
      });

    });
  }

  isCustActionVisible(actionId: string) {
    if (actionId == 'remove_extra_iscsi_group' && this.initialCount <= this.initialCount_default) {
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

    this.loader.open();
    this.busy = this.rest
      .put(this.target_resource_name + '/', {
        body : JSON.stringify(target_value),
      })
      .subscribe(
        (res) => {
          for (let i in iscsi_group_value) {
            if (iscsi_group_value[i].id) {
              if (iscsi_group_value[i].delete) {
                this.rest
                    .delete(this.targetgroup_resource_name + '/' + iscsi_group_value[i].id, {}).subscribe((res) => {
                    });
              } else {
                this.rest
                    .put(this.targetgroup_resource_name + '/' + iscsi_group_value[i].id, {
                      body: JSON.stringify(iscsi_group_value[i]),
                    })
                    .subscribe((res) => {
                    });
              }
            } else {
              iscsi_group_value[i].iscsi_target = this.target_id;
              this.rest
                .post(this.targetgroup_resource_name, {
                  body : JSON.stringify(iscsi_group_value[i]),
                }).subscribe();
            }
          }
          this.loader.close();
          this.router.navigate(new Array('').concat(this.route_success));
        },
        (res) => {
          this.loader.close();
          new EntityUtils().handleError(this, res);
        }
      );
  }
}

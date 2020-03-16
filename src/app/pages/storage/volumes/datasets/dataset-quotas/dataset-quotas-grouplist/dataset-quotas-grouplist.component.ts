import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WebSocketService, StorageService, DialogService, AppLoaderService } from '../../../../../../services';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { T } from '../../../../../../translate-marker';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-quotas';

@Component({
  selector: 'app-dataset-quotas-grouplist',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class DatasetQuotasGrouplistComponent {
  public title = "Dataset Groups";
  protected entityList: any;
  protected hasDetails = false;
  protected noActions = true;
  protected queryCall = 'group.query';
  public columnFilter = false;
  public pk: string;

  public columns: Array < any > = [
    { name: 'Group Name', prop: 'group', always_display: true, minWidth: 150},
    { name: 'GID', prop: 'gid', hidden: false },
    { name: 'Data Quota', prop: 'quota', hidden: false },
    { name: 'DQ % Used', prop: 'used_percent', hidden: false  },
    { name: 'Object Quota', prop: 'obj_quota', hidden: false },
    { name: 'OQ % Used', prop: 'obj_used_percent', hidden: false  }
  ];
  public rowIdentifier = 'group';
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    multiSelect: true,
    deleteMsg: {
      title: T('Group'),
      key_props: ['group']
    }
  };

  public multiActions: Array < any > = [{
    id: "addToForm",
    label: helptext.groups.action_label,
    icon: "add",
    enable: true,
    ttpos: "above",
    onClick: (selected) => {
      const self = this;
      const groupNames = [];
      const gids = [];
      let groups = '';
      selected.map(group => {
        groupNames.push(group.group);
        gids.push(group.gid);
      })
      groups = groupNames.join(', ');
      const conf: DialogFormConfiguration = {
        title: helptext.groups.dialog.title,
        fieldConfig: [
          {
            type: 'textarea',
            name: 'selected_groups',
            placeholder: helptext.groups.dialog.list.placeholder,
            tooltip:  helptext.groups.dialog.list.tooltip,
            value: groups,
            readonly: true
          },
          {
            type: 'input',
            name: 'group_data_quota',
            placeholder: helptext.groups.dialog.data_quota.placeholder,
            tooltip: helptext.groups.dialog.data_quota.tooltip,
            value: 0,
            blurStatus: true,
            blurEvent: self.groupBlurEvent,
            parent: self,
          },
          {
            type: 'input',
            name: 'group_obj_quota',
            placeholder: helptext.groups.dialog.obj_quota.placeholder,
            tooltip: helptext.groups.dialog.obj_quota.tooltip,
            value: 0
          }
        ],
        saveButtonText: helptext.shared.set,
        cancelButtonText: helptext.shared.cancel,

        customSubmit(data) {
          const groupData = data.formValue;
          groupData.group = [];
          gids.map(gid => {
            groupData.group.push(gid)
          })
          const payload = [];
          if (groupData.group) {
            groupData.group.forEach((group) => {
              payload.push({
                quota_type: 'GROUP',
                id: group.toString(),
                quota_value: groupData.group_data_quota
              },
              {
                quota_type: 'GROUPOBJ',
                id: group.toString(),
                quota_value: groupData.group_obj_quota
              })
            });
          }
          self.loader.open();
          self.ws.call('pool.dataset.set_quota', [self.pk, payload]).subscribe(res => {
            self.loader.close();
            self.dialogService.closeAllDialogs();
            self.entityList.getData();
            selected.length = 0;
          })
        }
      }
      this.dialogService.dialogFormWide(conf);

    }
  }];

  constructor(protected ws: WebSocketService, protected storageService: StorageService,
    protected dialogService: DialogService, protected loader: AppLoaderService,
    protected router: Router, protected aroute: ActivatedRoute) { }

  resourceTransformIncomingRestData(data) {
    this.ws.call('pool.dataset.get_quota', [this.pk, 'GROUP']).subscribe(res => {
      data.map(item => {
        res.map(i => {
          if(item.group === i.name) {
            item.quota = this.storageService.convertBytestoHumanReadable(i.quota, 0);
            item.used = i.used_percent;
            item.obj_quota = i.obj_quota;
            item.obj_used_percent = i.obj_used_percent;
          }
        })
      })
    })
    return data;
  }

  preInit(entityList) {
    this.entityList = entityList;
    const paramMap: any = (<any>this.aroute.params).getValue();
    this.pk = paramMap.pk;
  }

  groupBlurEvent(parent) {
    if (parent.storageService.humanReadable) {
      parent.transformValue(parent, 'group_data_quota');
    }
  }



}

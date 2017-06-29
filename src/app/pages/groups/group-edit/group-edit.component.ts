import {
  ApplicationRef,
  Component,
  Injector,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import {Router} from '@angular/router';
import {
  DynamicCheckboxModel,
  DynamicFormControlModel,
  DynamicFormService,
  DynamicInputModel,
  DynamicRadioGroupModel,
  DynamicSelectModel
} from '@ng2-dynamic-forms/core';

import {RestService} from '../../../services/rest.service';

@Component({
  selector : 'app-group-edit',
  template : `<entity-edit [conf]="this"></entity-edit>`
})
export class GroupEditComponent {

  public resource_name: string = 'account/groups/';
  public route_delete: string[] = [ 'groups', 'delete' ];
  public route_success: string[] = [ 'groups' ];

  public formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
      id : 'bsdgrp_gid',
      label : 'GID',
    }),
    new DynamicInputModel({
      id : 'bsdgrp_group',
      label : 'Group',
    }),
  ];

  public users: any[];

  constructor(protected router: Router, protected rest: RestService,
              protected formService: DynamicFormService,
              protected _injector: Injector,
              protected _appRef: ApplicationRef) {}

  afterInit(entityEdit: any) {
    this.rest.get('account/users/', {limit : 0}).subscribe((res) => {
      this.users = res.data;
    });
  }

  clean(data) {
    if (data['bsdgrp_builtin']) {
      delete data['bsdgrp_name'];
      delete data['bsdgrp_gid'];
    }
    return data;
  }
}

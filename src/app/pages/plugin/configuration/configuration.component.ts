import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { DynamicFormControlModel, DynamicFormService, DynamicFormGroupModel, DynamicCheckboxModel, DynamicInputModel } from '@ng2-dynamic-forms/core';
import { GlobalState } from '../../../global.state';
import { RestService, WebSocketService } from '../../../services/';

@Component({
  selector: 'app-plugin-configuration',
  template: `
  <entity-config [conf]="this"></entity-config>
  `
})
export class PluginConfigurationComponent {

  protected resource_name: string = 'plugins/configuration/';

  public formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
      id: 'repourl',
      label: 'Repository URL',
    }),
  ];

  constructor(protected router: Router, protected rest: RestService, protected ws: WebSocketService, protected formService: DynamicFormService, protected _injector: Injector, protected _appRef: ApplicationRef, protected _state: GlobalState) {

  }

  afterInit(entityEdit: any) {
  }

}

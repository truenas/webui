import {Component} from '@angular/core';
import {
  DynamicCheckboxModel,
  DynamicFormControlModel,
  DynamicFormService
} from '@ng2-dynamic-forms/core';
import {Subscription} from 'rxjs';

import {RestService, WebSocketService} from '../../../../services/';

@Component({
  selector : 'config-reset',
  template : `
  <alert type="info"><strong>The system will reboot to perform this operation!</strong></alert>
  <p>Are you sure you want to reset configuration?</p>
  <common-form [conf]="this" [busy]="sub" successMessage="Config resetted. Rebooting..." (success)="onSuccess()"></common-form>`
})
export class ConfigResetComponent {

  public sub: Subscription;

  public resource_name: string = 'system/config/factory_restore';
  public formModel: DynamicFormControlModel[] = [];

  constructor(protected ws: WebSocketService) {}

  onSuccess() { this.ws.call('system.reboot', [ {delay : 5} ]); }
}
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

import { WebSocketService, DialogService } from '../../../../../services/';
import { helptext_system_update as helptext } from 'app/helptext/system/update';

@Component({
  selector: 'app-manualupdate-save-config',
  templateUrl: './manualupdateconfig-save.component.html'
})

export class ManualUpdateConfigSaveComponent {

  public sub: Subscription;
  public secretseed = false;
  public route_success: string[] = ['system','update','manualupdate'];

  constructor(protected ws: WebSocketService, protected router: Router, public dialog: DialogService) {}

  doSubmit() {
    this.sub = this.ws.call('core.download', ['config.save', [{ 'secretseed': this.secretseed }], 'freenas.db'])
      .subscribe(
        (res) => {
          window.location.href = res[1];
          this.router.navigate(new Array('').concat(this.route_success));
        },
        (err) => {
          this.dialog.errorReport(helptext.save_config_err.title, helptext.save_config_err.message);
        }
      );
  }

  goBack() {
    this.router.navigate(new Array('').concat(this.route_success));
  }
}

import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Http } from '@angular/http';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

import { WebSocketService, DialogService, StorageService } from '../../../../../services/';
import { helptext_system_update as helptext } from 'app/helptext/system/update';

@Component({
  selector: 'app-manualupdate-save-config',
  templateUrl: './manualupdateconfig-save.component.html'
})

export class ManualUpdateConfigSaveComponent {

  public sub: Subscription;
  public secretseed = false;
  public route_success: string[] = ['system','update','manualupdate'];

  constructor(protected ws: WebSocketService, protected router: Router, public dialog: DialogService,
    protected storage: StorageService, protected http: Http ) {}

  doSubmit() {
    const fileName = 'freenas.db';
    const mimetype = 'application/x-sqlite3';
    this.sub = this.ws.call('core.download', ['config.save', [{ 'secretseed': this.secretseed }], fileName])
      .subscribe(
        (succ) => {
          const url = succ[1];
          this.storage.streamDownloadFile(this.http, url, fileName, mimetype)
          .subscribe(file => {
            this.storage.downloadBlob(file, fileName);
          }, err => {
            this.dialog.errorReport(helptext.save_config_err.title, helptext.save_config_err.message);
          })
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

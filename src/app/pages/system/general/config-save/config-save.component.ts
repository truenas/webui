import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormGroup, Validator } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

import { WebSocketService, SystemGeneralService } from '../../../../services/';
import { MatSnackBar } from '@angular/material';
import { Location, DatePipe } from '@angular/common';

@Component({
  selector: 'general-config-save',
  templateUrl: './config-save.component.html',
  providers: [SystemGeneralService, DatePipe],
})

export class ConfigSaveComponent {

  public sub: Subscription;
  public secretseed = false;
  public route_success: string[] = ['system', 'general'];
  protected fileName: string = "freenas.db";
  constructor(protected ws: WebSocketService,
              protected router: Router,
              public snackBar: MatSnackBar,
              private _location: Location,
              protected systemService: SystemGeneralService,
              protected datePipe: DatePipe) {}

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action , {
    	duration: 5000
    });
  }

  doSubmit() {
    this.systemService.getSysInfo().subscribe((res) => {
      if (res) {
        let hostname = res.hostname.split('.')[0];
        let date = this.datePipe.transform(new Date(),"yyyyMMddHHmmss");
        this.fileName = hostname + '-' + res.version + '-' + date + '.db';
      }

      this.sub = this.ws.call('core.download', ['config.save', [{ 'secretseed': this.secretseed }], this.fileName])
        .subscribe(
          (res) => {
            this.openSnackBar("Redirecting to download. Make sure you have pop up enabled in your browser.", "Success");
            window.open(res[1]);
          },
          (err) => {
            this.openSnackBar("Please check your network connection", "Failed");
          }
        );
    });
  }

  goBack() {
    this.router.navigate(new Array('').concat(this.route_success));
  }
}

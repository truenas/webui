import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormGroup, Validator } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

import { WebSocketService } from '../../../../../services/';
import { MatSnackBar } from '@angular/material';
import { Location } from '@angular/common';

@Component({
  selector: 'app-manualupdate-save-config',
  templateUrl: './manualupdateconfig-save.component.html'
})

export class ManualUpdateConfigSaveComponent {

  public sub: Subscription;
  public secretseed = false;
  public route_success: string[] = ['system','update','manualupdate'];

  constructor(protected ws: WebSocketService, protected router: Router, public snackBar: MatSnackBar) {}

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action , {
    	duration: 5000
    });
  }

  doSubmit() {
    this.sub = this.ws.call('core.download', ['config.save', [{ 'secretseed': this.secretseed }], 'freenas.db'])
      .subscribe(
        (res) => {
          this.openSnackBar("Download Sucessful", "Success");
          window.location.href = res[1];
          this.router.navigate(new Array('').concat(this.route_success));
        },
        (err) => {
          this.openSnackBar("Check the network connection.", "Failed");
        }
      );
  }

  goBack() {
    this.router.navigate(new Array('').concat(this.route_success));
  }
}

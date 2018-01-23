import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormGroup, Validator } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

import { WebSocketService } from '../../../../services/';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'general-config-save',
  templateUrl: './config-save.component.html'
})

export class ConfigSaveComponent {

  public sub: Subscription;
  public secretseed: boolean = false;

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
          this.openSnackBar("Redirecting to download. Make sure you have pop up enabled in your browser.", "Success");
          window.open(res[1]);
        },
        (err) => {
          this.openSnackBar("Please check your network connection", "Failed");
        }
      );
  }
}

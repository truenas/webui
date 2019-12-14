import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs';
import { Observable } from 'rxjs/Observable';
import { MatSnackBar } from '@angular/material';
import { RestService, WebSocketService, DialogService } from '../../../../services/';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'config-reset',
  templateUrl: './config-reset.component.html'
})
export class ConfigResetComponent {

  public route_success: string[] = ['system', 'general'];
  constructor(protected router: Router, protected ws: WebSocketService, protected rest:RestService, private _location: Location, public snackBar: MatSnackBar, protected dialogService: DialogService) {}

  _displayTime() {

  }
  doSubmit() {
    this.rest.post('system/config/factory_restore', {}).subscribe(restore => {
      this.ws.call('system.reboot', [{ delay: 5 }]).subscribe((res) => {
        // this.countDown = setInterval( () => {if(this.count>0){this.count -= 1}}, 1000);
        this.openSnackBar("System will reboot in 5 seconds", "Rebooting");
      });;
    }, (err) => {
      this.dialogService.errorReport("Error Resetting Configuration", err.error, err.trace.formatted);
    });
  }

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 5000
    });
  }

  goBack() {
    this.router.navigate(new Array('').concat(this.route_success));
  }
}

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { WebSocketService } from '../../../services/ws.service';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { TranslateService } from '@ngx-translate/core';
import { DialogService } from '../../../services/dialog.service';
import { MatDialog } from '@angular/material';

@Component({
  selector: 'system-reboot',
  templateUrl: './reboot.component.html',
  styleUrls: ['./reboot.component.css']
})
export class RebootComponent implements OnInit {

  public is_freenas: Boolean = false;

  constructor(protected ws: WebSocketService, protected router: Router, 
    protected loader: AppLoaderService, public translate: TranslateService,
    protected dialogService: DialogService, protected dialog: MatDialog) {
      this.ws = ws;
      this.ws.call('system.is_freenas').subscribe((res)=>{
        this.is_freenas = res;
      });
  }

  isWSConnected() {
    if (this.ws.connected) {
      this.loader.close();
      // ws is connected
      window.location.href = '/session/signin';
    } else {
      setTimeout(() => {
        this.isWSConnected();
      }, 5000);
    }
  }

  ngOnInit() {
    this.dialog.closeAll();
    this.ws.call('system.reboot', {}).subscribe(
      (res) => {
      },
      (res) => { // error on reboot
        this.dialogService.errorReport(res.error, res.reason, res.trace.formatted).subscribe(closed => {
          this.router.navigate(['/session/signin']);
        });
      },
      () => { // show reboot screen
        this.ws.prepare_shutdown();
        this.loader.open();
        setTimeout(() => {
          this.isWSConnected();
        }, 1000);
      });
  }
}

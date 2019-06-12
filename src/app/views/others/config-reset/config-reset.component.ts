import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { WebSocketService } from '../../../services/ws.service';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { TranslateService } from '@ngx-translate/core';
import { DialogService } from '../../../services/dialog.service';
import { SystemGeneralService } from '../../../services/system-general.service';
import { MatDialog } from '@angular/material';
import globalHelptext from '../../../helptext/global-helptext';
import { EntityJobComponent } from '../../../../app/pages/common/entity/entity-job/entity-job.component';
import { T } from '../../../translate-marker';

@Component({
  selector: 'app-config-reset',
  templateUrl: './config-reset.component.html',
  styleUrls: ['./config-reset.component.css'],
  providers: [SystemGeneralService]
})
export class ConfigResetComponent implements OnInit {

  public is_freenas: Boolean = false;
  public copyrightYear = globalHelptext.copyright_year;
  public dialogRef: any;
  public shouldReboot: boolean = true;

  constructor(protected ws: WebSocketService, protected router: Router, 
    protected loader: AppLoaderService, public translate: TranslateService,
    protected dialogService: DialogService, protected dialog: MatDialog, 
    private sysGeneralService: SystemGeneralService) {
      this.ws = ws;
      this.ws.call('system.is_freenas').subscribe((res)=>{
        this.is_freenas = res;
      });
  }

  isWSConnected() {
    if (this.ws.connected) {
      this.loader.close();
      // ws is connected
      this.router.navigate(['/session/signin']);
    } else {
      setTimeout(() => {
        this.isWSConnected();
      }, 5000);
    }
  }

  ngOnInit() {
    if (window.localStorage.getItem('is_freenas') === 'true') {
      this.is_freenas = true;
    } 
    this.dialog.closeAll();
    this.sysGeneralService.shouldReboot.subscribe((reboot: string) => {
      console.log('Reboot Status: ' + reboot);
    })
    // this.resetConfigSubmit();
  }

  // resetConfigSubmit() {
  //   let message;
  //   this.shouldReboot ? message = 'The system will restart.' : message = 'You will be logged out.';
    
  //   this.dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": "Resetting..." }, disableClose: true });
  //   this.dialogRef.componentInstance.setCall('config.reset', [{ reboot: this.shouldReboot}]);
  //   this.dialogRef.componentInstance.setDescription(T('Resetting system configuration to default settings. ' + message));
  //   this.dialogRef.componentInstance.submit();
  //   this.dialogRef.componentInstance.success.subscribe(() => {
  //     this.dialogRef.close();
  //     if (!this.shouldReboot) {
  //       this.ws.logout();
  //       this.dialog.closeAll();
  //       this.router.navigate(['/session/signin']);
  //     } else {
  //       this.ws.prepare_shutdown();
  //       this.loader.open();
  //       setTimeout(() => {
  //         this.isWSConnected();
  //       }, 15000);
  //     }
  //   });
  //   this.dialogRef.componentInstance.failure.subscribe((res) => {
  //     this.dialogRef.close();
  //     this.dialogService.errorReport(res.error, res.state, res.exception);
  //   });
  // }

}

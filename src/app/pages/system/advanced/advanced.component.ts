import { Component, OnInit } from '@angular/core';
import { WebSocketService } from "../../../services/ws.service";
import { RestService } from "../../../services/rest.service";
import { Observable } from "rxjs/Observable";
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import { AppLoaderService } from "../../../services/app-loader/app-loader.service";
import { DialogService } from "../../../services/dialog.service";
import { MdSnackBar, MdDialog } from '@angular/material';

@Component({
  selector: 'app-system-advanced',
  templateUrl: 'advanced.component.html',
  styleUrls: ['advanced.component.css']
})
export class AdvancedComponent implements OnInit {

  isReady: boolean = false;
  error: string;
  success: string;
  users: any;
  ports: any;
  public job: any = {};
  protected dialogRef: any;
  systemAdvancedSettings = {
    adv_consolemenu: '',
    adv_serialconsole: '',
    adv_serialport: '',
    adv_serialspeed: '',
    adv_swapondrive: '',
    adv_consolescreensaver: '',
    adv_powerdaemon: '',
    adv_autotune: '',
    adv_debugkernel: '',
    adv_consolemsg: '',
    adv_motd: '',
    adv_traceback: '',
    adv_advancedmode: '',
    adv_uploadcrash: '',
    adv_periodic_notifyuser: '',
    adv_graphite: '',
    adv_fqdn_syslog: '',
    adv_cpu_in_percentage: '',
  };

  constructor(private rest: RestService,
    private load: AppLoaderService,
    private dialog: DialogService,
    private ws: WebSocketService,
    public snackBar: MdSnackBar) {}

  ngOnInit(): void {
    const deviceInfo = this.ws.call('device.get_info', ['SERIAL']);
    const users = this.rest.get('account/users/', { limit: 0 });
    const systemSettings = this.rest.get('system/advanced', { limit: 0 });
    Observable.forkJoin([deviceInfo, users, systemSettings]).subscribe(results => {
      // listing serial ports
      this.ports = results[0];
      // users with their data
      this.users = results[1].data;
      // setting current system data
      console.log(results[2].data);
      this.buildForm(results[2].data);
      // readying the page
      this.isReady = true;
    }, res => {
      this.isReady = true;
      this.error = 'Something went wrong, please try again later.';
    });
  }

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 5000
    });
  }

  saveDebug() {
    this.dialog.confirm("Gererating Debug File", "It may take several minutes, you can close the dialog");
    this.ws.job('system.debug').subscribe((res) => {
      if (res.state === "SUCCESS") {
        this.openSnackBar("Redirecting to download. Make sure you have pop up enabled in your browser.", "Success");
        window.open('/legacy/system/debug/download/');
      }
    }, () => {

    }, () => {
          if (this.job.state == 'SUCCESS') {
            console.log("success:",this.job);
          } else if (this.job.state == 'FAILED') {
            this.openSnackBar("Please check your network connection", "Failed");
          }
    });
  }

  buildForm(system: any) {
    this.systemAdvancedSettings = {
      adv_consolemenu: system.adv_consolemenu,
      adv_serialconsole: system.adv_serialconsole,
      adv_serialport: system.adv_serialport,
      adv_serialspeed: system.adv_serialspeed,
      adv_swapondrive: system.adv_swapondrive,
      adv_consolescreensaver: system.adv_consolescreensaver,
      adv_powerdaemon: system.adv_powerdaemon,
      adv_autotune: system.adv_autotune,
      adv_debugkernel: system.adv_debugkernel,
      adv_consolemsg: system.adv_consolemsg,
      adv_motd: system.adv_motd,
      adv_traceback: system.adv_traceback,
      adv_advancedmode: system.adv_advancedmode,
      adv_uploadcrash: system.adv_uploadcrash,
      adv_periodic_notifyuser: system.adv_periodic_notifyuser,
      adv_graphite: system.adv_graphite,
      adv_fqdn_syslog: system.adv_fqdn_syslog,
      adv_cpu_in_percentage: system.adv_cpu_in_percentage,
    };
  }

  onFormSubmit() {
    this.load.open('Updating settings...');
    this.rest.put('system/advanced', { body: this.systemAdvancedSettings })
      .subscribe(res => {
        this.systemAdvancedSettings = res.data;
        this.success = 'System settings updated';
        setTimeout(() => this.success = '', 5000);
        this.load.close();
      }, res => {
        this.dialog.errorReport(res.error, res.reason, res.trace.formatted);
        this.load.close();
      })
  }
}

import { Component, OnInit } from '@angular/core';
import { WebSocketService } from "../../../services/ws.service";
import { RestService } from "../../../services/rest.service";
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import { AppLoaderService } from "../../../services/app-loader/app-loader.service";
import { DialogService } from "../../../services/dialog.service";
import { MatSnackBar, MatDialog } from '@angular/material';
import { Observable, Subject, Subscription } from 'rxjs/Rx';

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

  public adv_consolemenu_tooltip = 'Uncheck this to add a login prompt\
 to the system before the console menu is shown.';
  public adv_serialconsole_tooltip = '<b>Do not</b> check this box if\
 the <b>serial port</b> is disabled.';
  public adv_serialport_tooltip = 'Select the serial port address in\
 hex.';
  public adv_serialspeed_tooltip = 'Choose the speed in <i>bps</i> used\
 by the serial port.';
  public adv_swapondrive_tooltip = 'By default, all data disks are\
 created with this amount of swap. This setting does not affect log or\
 cache devices as they are created without swap.';
  public adv_consolescreensaver_tooltip = 'Enable or disable the console\
 screensaver.';
  public adv_powerdaemon_tooltip = '<a\
 href="https://www.freebsd.org/cgi/man.cgi?query=powerd&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
 target="_blank">powerd(8)</a> monitors the system state and sets the\
 CPU frequency accordingly.';
  public adv_autotune_tooltip = 'Enables the <b>autotune</b> script\
 which attempts to optimize the system depending on the installed\
 hardware. <b>Warning:</b> Autotuning should only be used as a temporary\
 measure and is not a permanent fix for system hardware issues. See\
 <b>Chapter 5.4.1: Autotune</b> in the <a href="ui/guide">Guide</a> for\
 more information.';
  public adv_debugkernel_tooltip = 'When checked, the next system boot\
 uses a debug version of the kernel.';
  public adv_consolemsg_tooltip = 'Display console messages in real time\
 at the bottom of the browser. Click the <b>Console</b> to bring up a\
 scrollable screen. Check the <b>Stop</b> refresh box in the scrollable\
 screen to pause updating and uncheck the box to continue to watch the\
 messages as they occur.';
  public adv_motd_tooltip = 'Write a message to be shown when a user\
 logs in with SSH.';
  public adv_traceback_tooltip = 'Provides a pop-up window of diagnostic\
 information when a fatal error occurs.';
  public adv_advancedmode_tooltip: 'Many GUI menus provide an\
 <b>Advanced Mode</b> button to access additional features. Enabling\
 this shows these features by default.';
  public adv_uploadcrash_tooltip = 'Report kernel crash dumps and daily\
 performance measurements to iXsystems.';
  public adv_periodic_notifyuser_tooltip = 'Choose a user to receive\
 security output emails. This output runs nightly, but only sends an\
 email when the system reboots or encounters an error.';
  public adv_graphite_tooltip = 'Enter the IP address or hostname of a\
 remote server running Graphite.';
  public adv_fqdn_syslog_tooltip = 'Check to include the\
 Fully-Qualified Domain Name (FQDN) in logs to precisely identify\
 systems with similar hostnames.';
  public adv_cpu_in_percentage_tooltip = 'Check to display CPU usage\
 as percentages in <b>Reporting</b>.'

  constructor(private rest: RestService,
    private load: AppLoaderService,
    private dialog: DialogService,
    private ws: WebSocketService,
    public snackBar: MatSnackBar) {}

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
    this.dialog.confirm("Generating Debug File", "Run this in the background?").subscribe((res) => {
      if (res) {
        this.ws.job('system.debug').subscribe((res) => {
          console.log(res);
          if (res.state === "SUCCESS") {
            this.ws.call('core.download', ['filesystem.get', [res.result], 'debug.tgz']).subscribe(
              (res) => {
                this.openSnackBar("Redirecting to download. Make sure pop-ups are enabled in the browser.", "Success");
                window.open(res[1]);
              },
              (err) => {
                this.openSnackBar("Please check the network connection", "Failed");
              }
            );
          }
        }, () => {

        }, () => {
          if (this.job.state == 'SUCCESS') {} else if (this.job.state == 'FAILED') {
            this.openSnackBar("Please check the network connection", "Failed");
          }
        });
      } else {
        console.log("User canceled");
      }
    });
  }

  generateDownloadUrl(file_path) {
    return this.ws.call('filesystem.get', file_path);
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
      });
  }
}

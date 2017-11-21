
import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {WebSocketService} from "../../../services/ws.service";
import {RestService} from "../../../services/rest.service";
import {Observable} from "rxjs/Observable";

@Component({
  selector: 'app-system-advanced',
  templateUrl: 'advanced.component.html'
})
export class AdvancedComponent implements OnInit {

  systemAdvancedSettings: any;

  constructor(private formBuilder: FormBuilder,
              private rest: RestService,
              protected ws: WebSocketService) {
  }

  ngOnInit(): void {
    this.buildForm();
    const deviceInfo = this.ws.call('device.get_info', ['SERIAL']);
    const users = this.rest.get('account/users/', {limit: 0});
    const systemSettings = this.rest.get('system/advanced', {limit: 0});
    Observable.forkJoin([deviceInfo, users, systemSettings]).subscribe(results => {

      this.systemAdvancedSettings = results[2].data;
    })
  }

  buildForm(system?:any) {
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
      adv_fqdn_syslog: system.adv_fqdn_syslog
    };
  }

  onFormSubmit() {

  }
}


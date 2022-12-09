import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { CoreEvent } from './core.service';

interface InfoObject {
  version: string; // "TrueNAS-12.0-MASTER-202003160424"
  buildtime: any; // {$date: 1584373672000}
  hostname: string; // "truenas.local"
  physmem: number; // 8445599744
  model: string; // "Intel(R) Core(TM) i3-2100T CPU @ 2.50GHz"
  cores: number; // 4
  loadavg: number[]; // [0.15380859375, 0.24169921875, 0.22900390625]
  uptime: string; // "4:25PM  up 7 days, 37 mins"
  uptime_seconds: number; // 607039.9912204742
  system_serial: string;
  system_product: string;
  license: any;
  boottime: any; // {$date: 1584373672000}
  datetime: any; // {$date: 1585005911991}
  timezone: string; // "America/Los_Angeles"
  system_manufacturer: string; // null
  ecc_memory: boolean; // false
}

interface HAStatus {
  status: 'HA Enabled' | 'HA Disabled';
  reasons?: any;
}

@Injectable({
  providedIn: 'root',
})
export class SystemProfileService extends BaseService {
  cache: any;
  private buffer: CoreEvent[] = [];
  private emulateHardware?: InfoObject;
  private mini: InfoObject = {
    version: 'TrueNAS-12.0-MASTER-202003160424',
    buildtime: { $date: 1584373672000 },
    hostname: 'truenas.local',
    physmem: 8445599744,
    model: 'Intel(R) Core(TM) i3-2100T CPU @ 2.50GHz',
    cores: 4,
    loadavg: [0.15380859375, 0.24169921875, 0.22900390625],
    uptime: '4:25PM  up 7 days, 37 mins',
    uptime_seconds: 607039.9912204742,
    system_serial: '123456789',
    system_product: 'FREENAS-MINI-3.0',
    license: { model: 'FREENAS-MINI-3.0' },
    boottime: { $date: 1584373672000 },
    datetime: { $date: 1585005911991 },
    timezone: 'America/Los_Angeles',
    system_manufacturer: 'ixsystems',
    ecc_memory: true,
  };

  private ha_status: HAStatus;

  features = {
    HA: false,
    enclosure: false,
  };

  constructor() {
    super();

    this.core
      .register({
        observerClass: this,
        eventName: 'SysInfoRequest',
      })
      .subscribe((evt: CoreEvent) => {
        this.fetchProfile();
      });

    this.core
      .register({
        observerClass: this,
        eventName: 'HAStatusRequest',
      })
      .subscribe((evt: CoreEvent) => {
        if (this.features.HA) {
          // This is a TrueNAS box with HA support
          this.websocket.call('failover.disabled_reasons').subscribe((res) => {
            this.updateHA(res);
          });
        }
      });

    this.websocket.call('failover.disabled_reasons').subscribe((res) => {
      this.updateHA(res);
    });

    // HA Status change events
    this.websocket.subscribe('failover.disabled_reasons').subscribe((res) => {
      this.updateHA(res.fields.disabled_reasons);
    });
  }

  protected onAuthenticated(evt: CoreEvent) {
    this.authenticated = true;
  }

  fetchProfile(localOnly?: boolean) {
    this.websocket.call('system.info').subscribe((res) => {
      this.cache = res;

      this.respond({ name: 'SysInfoRequest', sender: this });
    });
  }

  clearBuffer() {
    this.buffer.forEach((evt) => {
      this.respond(evt);
    });
  }

  respond(evt: CoreEvent) {
    let data;
    let responseEvent;
    switch (evt.name) {
      case 'SysInfoRequest':
        data = this.cache;
        responseEvent = 'SysInfo';
        break;
    }
    data.features = this.detectFeatures(data);
    this.core.emit({ name: responseEvent, data, sender: this });
  }

  detectFeatures(_profile: any) {
    // ENCLOSURE SUPPORT
    const profile = { ..._profile };

    if (!profile.system_product) {
      // Stick with defaults if value is null
      return this.features;
    }

    if (
      profile.system_product.includes('FREENAS-MINI-3.0')
      || profile.system_product.includes('TRUENAS-')
    ) {
      this.features.enclosure = true;
    }

    // HIGH AVAILABILITY SUPPORT
    if (
      (profile.license && profile.license.system_serial_ha)
      || profile.system_product == 'BHYVE'
    ) {
      this.features.HA = true;
    }

    return this.features;
  }

  updateHA(res) {
    const ha_enabled = res.length == 0;
    const enabled_txt = res.length == 0 ? 'HA Enabled' : 'HA Disabled';

    window.sessionStorage.setItem('ha_status', ha_enabled.toString());
    this.ha_status = { status: enabled_txt, reasons: res };
    this.core.emit({ name: 'HA_Status', data: this.ha_status, sender: this });
  }
}

import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { CoreEvent } from 'app/interfaces/events';
import { HaStatus } from 'app/interfaces/events/ha-status-event.interface';
import { SystemFeatures } from 'app/interfaces/events/sys-info-event.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { BaseService } from 'app/services/base.service';
import { CoreService } from 'app/services/core-service/core.service';
import { WebSocketService } from 'app/services/index';
import { AppState } from 'app/store';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@Injectable({
  providedIn: 'root',
})
export class SystemProfileService extends BaseService {
  cache: SystemInfo;
  private buffer: CoreEvent[] = [];

  private haStatus: HaStatus;

  features: SystemFeatures = {
    HA: false,
    enclosure: false,
  };

  constructor(
    protected core: CoreService,
    protected websocket: WebSocketService,
    private store$: Store<AppState>,
  ) {
    super(core, websocket);

    this.core.register({
      observerClass: this,
      eventName: 'SysInfoRequest',
    }).subscribe((evt: CoreEvent) => {
      const ready = this.dataAvailable(evt);
      if (ready) {
        this.respond({ name: 'SysInfoRequest', sender: this });
      }
    });

    this.core.register({
      observerClass: this,
      eventName: 'HAStatusRequest',
    }).subscribe(() => {
      if (this.cache && this.features.HA) {
        // This is a TrueNAS box with HA support
        if (this.haStatus && this.haStatus.status.length > 0) {
          this.core.emit({ name: 'HA_Status', data: this.haStatus, sender: this });
        }
      }
    });

    // HA Status change events
    this.websocket.subscribe('failover.disabled.reasons').subscribe((res) => {
      this.updateHa(res.fields);
    });
  }

  protected onAuthenticated(): void {
    this.authenticated = true;
  }

  private dataAvailable(evt: CoreEvent): boolean {
    if (this.cache && this.authenticated) {
      return true;
    } if (!this.cache && this.authenticated) {
      if (this.buffer.length === 0) {
        this.fetchProfile();
      }
      this.buffer.push(evt);
      return false;
    } if (!this.authenticated) {
      return false;
    }
  }

  fetchProfile(localOnly?: boolean): void {
    this.store$.pipe(waitForSystemInfo).subscribe((systemInfo) => {
      this.cache = systemInfo;
      if (localOnly) {
        this.buffer.push({ name: 'SysInfoRequest', sender: this });
        return;
      }

      if (this.buffer.length > 0) {
        this.clearBuffer();
      }
    });
  }

  clearBuffer(): void {
    this.buffer.forEach((evt) => {
      this.respond(evt);
    });
  }

  respond(evt: CoreEvent): void {
    if (evt.name !== 'SysInfoRequest') {
      return;
    }

    this.core.emit({
      name: 'SysInfo',
      data: {
        ...this.cache,
        features: this.detectFeatures(this.cache),
      },
      sender: this,
    });
  }

  detectFeatures(systemInfo: SystemInfo): SystemFeatures {
    // ENCLOSURE SUPPORT
    const profile = { ...systemInfo };

    if (!profile.system_product) {
      // Stick with defaults if value is null
      return this.features;
    }

    if (profile.system_product.includes('FREENAS-MINI-3.0') || profile.system_product.includes('TRUENAS-')) {
      this.features.enclosure = true;
    }

    // HIGH AVAILABILITY SUPPORT
    if ((profile.license && profile.license.system_serial_ha) || profile.system_product === 'BHYVE') {
      this.features.HA = true;

      // HA Status Change Call
      this.websocket.call('failover.disabled.reasons').subscribe((res) => {
        this.updateHa(res);
      });
    }

    return this.features;
  }

  updateHa(res: FailoverDisabledReason[]): void {
    const haEnabled = res.length === 0;

    const enabledText = res.length === 0 ? 'HA Enabled' : 'HA Disabled';

    window.sessionStorage.setItem('ha_status', haEnabled.toString());
    this.haStatus = { status: enabledText, reasons: res };
    this.core.emit({ name: 'HA_Status', data: this.haStatus, sender: this });
  }
}

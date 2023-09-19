import { Injectable } from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { BehaviorSubject, of } from 'rxjs';
import { LicenseFeature } from 'app/enums/license-feature.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { SystemFeatures } from 'app/interfaces/events/sys-info-event.interface';
import { MenuItem, MenuItemType } from 'app/interfaces/menu-item.interface';
import { SystemGeneralService } from 'app/services/system-general.service';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { waitForSystemFeatures, waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Injectable()
export class NavigationService {
  readonly hasFailover$ = new BehaviorSubject(false);
  readonly hasEnclosure$ = new BehaviorSubject(false);
  readonly hasVms$ = new BehaviorSubject(false);
  readonly hasApps$ = new BehaviorSubject(false);

  readonly menuItems: MenuItem[] = [
    {
      name: T('Dashboard'),
      type: MenuItemType.Link,
      tooltip: T('Dashboard'),
      icon: 'dashboard',
      state: 'dashboard',
    },
    {
      name: T('Storage'),
      type: MenuItemType.Link,
      tooltip: T('Storage'),
      icon: 'dns',
      state: 'storage',
    },
    {
      name: T('Datasets'),
      type: MenuItemType.Link,
      tooltip: T('Datasets'),
      icon: 'ix:dataset',
      state: 'datasets',
    },
    {
      name: T('Shares'),
      type: MenuItemType.Link,
      tooltip: T('Shares'),
      icon: 'folder_shared',
      state: 'sharing',
    },
    {
      name: T('Data Protection'),
      type: MenuItemType.Link,
      tooltip: T('Data Protection'),
      icon: 'security',
      state: 'data-protection',
    },
    {
      name: T('Network'),
      type: MenuItemType.Link,
      tooltip: T('Network'),
      icon: 'device_hub',
      state: 'network',
    },
    {
      name: T('Credentials'),
      type: MenuItemType.SlideOut,
      tooltip: T('Credentials'),
      icon: 'vpn_key',
      state: 'credentials',
      sub: [
        { name: T('Local Users'), state: 'users' },
        { name: T('Local Groups'), state: 'groups' },
        { name: T('Directory Services'), state: 'directory-services' },
        { name: T('Backup Credentials'), state: 'backup-credentials' },
        { name: T('Certificates'), state: 'certificates' },
        { name: T('2FA'), state: 'two-factor' },
        {
          name: 'KMIP',
          state: 'kmip',
          isVisible$: of(this.systemGeneralService.getProductType() === ProductType.ScaleEnterprise),
        },
      ],
    },
    {
      name: T('Virtualization'),
      type: MenuItemType.Link,
      tooltip: T('Virtualization'),
      icon: 'computer',
      state: 'vm',
      isVisible$: this.hasVms$,
    },
    {
      name: T('Apps'),
      type: MenuItemType.Link,
      tooltip: T('Apps'),
      icon: 'apps',
      state: 'apps',
      isVisible$: this.hasApps$,
    },
    {
      name: T('Reporting'),
      type: MenuItemType.Link,
      tooltip: T('Reports'),
      icon: 'insert_chart',
      state: 'reportsdashboard/cpu',
    },
    {
      name: T('System Settings'),
      type: MenuItemType.SlideOut,
      tooltip: T('System Settings'),
      icon: 'settings',
      state: 'system',
      sub: [
        { name: T('Update'), state: 'update' },
        { name: T('General'), state: 'general' },
        { name: T('Advanced'), state: 'advanced' },
        { name: T('Boot'), state: 'boot' },
        { name: T('Failover'), state: 'failover', isVisible$: this.hasFailover$ },
        { name: T('Services'), state: 'services' },
        { name: T('Shell'), state: 'shell' },
        { name: T('Alert Settings'), state: 'alert-settings' },
        { name: T('Enclosure'), state: 'viewenclosure', isVisible$: this.hasEnclosure$ },
      ],
    },
  ];

  constructor(
    private store$: Store<AppState>,
    private systemGeneralService: SystemGeneralService,
  ) {
    this.checkForFailoverSupport();
    this.checkForEnclosureSupport();
    this.checkForEnterpriseLicenses();
  }

  private checkForFailoverSupport(): void {
    this.store$.select(selectIsHaLicensed).pipe(untilDestroyed(this)).subscribe((hasFailover) => {
      this.hasFailover$.next(hasFailover);
    });
  }

  private checkForEnclosureSupport(): void {
    this.store$.pipe(waitForSystemFeatures, untilDestroyed(this))
      .subscribe((features: SystemFeatures) => {
        this.hasEnclosure$.next(features.enclosure);
      });
  }

  private checkForEnterpriseLicenses(): void {
    if (this.systemGeneralService.getProductType() !== ProductType.ScaleEnterprise) {
      this.hasVms$.next(true);
      this.hasApps$.next(true);
      return;
    }

    this.store$.pipe(waitForSystemInfo, untilDestroyed(this))
      .subscribe((systemInfo) => {
        const hasVms = systemInfo.license && Boolean(systemInfo.license.features.includes(LicenseFeature.Vm));
        this.hasVms$.next(hasVms);

        const hasApps = systemInfo.license && Boolean(systemInfo.license.features.includes(LicenseFeature.Jails));
        this.hasApps$.next(hasApps);
      });
  }
}

import { Injectable } from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { BehaviorSubject, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { LicenseFeature } from 'app/enums/license-feature.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { MenuItem, MenuItemType } from 'app/interfaces/menu-item.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { SystemGeneralService } from 'app/services/system-general.service';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { selectHasEnclosureSupport, waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  readonly hasFailover$ = this.store$.select(selectIsHaLicensed);
  readonly hasEnclosure$ = this.store$.select(selectHasEnclosureSupport);
  readonly hasVms$ = new BehaviorSubject(false);
  readonly hasApps$ = new BehaviorSubject(false);

  readonly menuItems: MenuItem[] = [
    {
      name: T('Dashboard'),
      type: MenuItemType.Link,
      tooltip: T('Dashboard'),
      icon: iconMarker('dashboard'),
      state: 'dashboard',
    },
    {
      name: T('Storage'),
      type: MenuItemType.Link,
      tooltip: T('Storage'),
      icon: iconMarker('dns'),
      state: 'storage',
    },
    {
      name: T('Datasets'),
      type: MenuItemType.Link,
      tooltip: T('Datasets'),
      icon: iconMarker('ix-dataset-root'),
      state: 'datasets',
    },
    {
      name: T('Shares'),
      type: MenuItemType.Link,
      tooltip: T('Shares'),
      icon: iconMarker('folder_shared'),
      state: 'sharing',
    },
    {
      name: T('Data Protection'),
      type: MenuItemType.Link,
      tooltip: T('Data Protection'),
      icon: iconMarker('security'),
      state: 'data-protection',
    },
    {
      name: T('Network'),
      type: MenuItemType.Link,
      tooltip: T('Network'),
      icon: iconMarker('device_hub'),
      state: 'network',
    },
    {
      name: T('Credentials'),
      type: MenuItemType.SlideOut,
      tooltip: T('Credentials'),
      icon: iconMarker('vpn_key'),
      state: 'credentials',
      sub: [
        { name: T('Users'), state: 'users' },
        { name: T('Groups'), state: 'groups' },
        { name: T('Directory Services'), state: 'directory-services' },
        { name: T('Backup Credentials'), state: 'backup-credentials' },
        { name: T('Certificates'), state: 'certificates' },
        {
          name: 'KMIP',
          state: 'kmip',
          isVisible$: of(this.systemGeneralService.getProductType() === ProductType.Enterprise),
        },
      ],
    },
    {
      name: T('Instances'),
      type: MenuItemType.Link,
      tooltip: T('Instances'),
      icon: iconMarker('mdi-laptop'),
      state: 'instances',
    },
    {
      name: T('Apps'),
      type: MenuItemType.Link,
      tooltip: T('Apps'),
      icon: iconMarker('apps'),
      state: 'apps',
      isVisible$: this.hasApps$,
    },
    {
      name: T('Reporting'),
      type: MenuItemType.Link,
      tooltip: T('Reports'),
      icon: iconMarker('insert_chart'),
      state: 'reportsdashboard/cpu',
    },
    {
      name: T('System'),
      type: MenuItemType.SlideOut,
      tooltip: T('System'),
      icon: iconMarker('settings'),
      state: 'system',
      sub: [
        { name: T('Update'), state: 'update' },
        { name: T('General Settings'), state: 'general' },
        { name: T('Advanced Settings'), state: 'advanced' },
        { name: T('Boot'), state: 'boot' },
        { name: T('Failover'), state: 'failover', isVisible$: this.hasFailover$ },
        { name: T('Services'), state: 'services' },
        {
          name: T('Shell'),
          state: 'shell',
          hasAccess$: this.authService.user$.pipe(map((user) => !!user?.privilege?.web_shell)),
        },
        { name: T('Alert Settings'), state: 'alert-settings' },
        { name: T('Audit'), state: 'audit' },
        { name: T('Enclosure'), state: 'viewenclosure', isVisible$: this.hasEnclosure$ },
      ],
    },
  ];

  constructor(
    private store$: Store<AppState>,
    private systemGeneralService: SystemGeneralService,
    private authService: AuthService,
  ) {
    this.checkForEnterpriseLicenses();
  }

  private checkForEnterpriseLicenses(): void {
    if (this.systemGeneralService.getProductType() !== ProductType.Enterprise) {
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

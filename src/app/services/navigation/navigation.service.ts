import { Injectable, inject } from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy } from '@ngneat/until-destroy';
import { map } from 'rxjs/operators';
import { MenuItem, MenuItemType } from 'app/interfaces/menu-item.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { LicenseService } from 'app/services/license.service';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  private license = inject(LicenseService);
  private authService = inject(AuthService);

  readonly menuItems: MenuItem[] = [
    {
      name: T('Dashboard'),
      type: MenuItemType.Link,
      tooltip: T('Dashboard'),
      icon: iconMarker('ix-desktop-dashboard'),
      iconActive: iconMarker('ix-desktop-dashboard-active'),
      state: 'dashboard',
    },
    {
      name: T('Storage'),
      type: MenuItemType.Link,
      tooltip: T('Storage'),
      icon: iconMarker('ix-desktop-storage'),
      iconActive: iconMarker('ix-desktop-storage-active'),
      state: 'storage',
    },
    {
      name: T('Datasets'),
      type: MenuItemType.Link,
      tooltip: T('Datasets'),
      icon: iconMarker('ix-desktop-datasets'),
      iconActive: iconMarker('ix-desktop-datasets-active'),
      state: 'datasets',
    },
    {
      name: T('Shares'),
      type: MenuItemType.Link,
      tooltip: T('Shares'),
      icon: iconMarker('ix-desktop-shares'),
      iconActive: iconMarker('ix-desktop-shares-active'),
      state: 'sharing',
    },
    {
      name: T('Data Protection'),
      type: MenuItemType.Link,
      tooltip: T('Data Protection'),
      icon: iconMarker('ix-desktop-data-protection'),
      iconActive: iconMarker('ix-desktop-data-protection-active'),
      state: 'data-protection',
    },
    {
      name: T('Credentials'),
      type: MenuItemType.SlideOut,
      tooltip: T('Credentials'),
      icon: iconMarker('ix-desktop-credentials'),
      iconActive: iconMarker('ix-desktop-credentials-active'),
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
          isVisible$: this.license.hasKmip$,
        },
      ],
    },
    // {
    //   name: T('Containers'),
    //   type: MenuItemType.Link,
    //   tooltip: T('Containers'),
    //   icon: iconMarker('mdi-package-variant-closed'),
    //   state: 'containers',
    //   isVisible$: this.license.shouldShowContainers$,
    // },
    {
      name: T('Virtual Machines'),
      type: MenuItemType.Link,
      tooltip: T('Virtual Machines'),
      icon: iconMarker('ix-desktop-virtual-machines'),
      iconActive: iconMarker('ix-desktop-virtual-machines-active'),
      state: 'vm',
      isVisible$: this.license.hasVms$,
    },
    {
      name: T('Apps'),
      type: MenuItemType.Link,
      tooltip: T('Apps'),
      icon: iconMarker('ix-desktop-apps'),
      iconActive: iconMarker('ix-desktop-apps-active'),
      state: 'apps',
      isVisible$: this.license.hasApps$,
    },
    {
      name: T('Reporting'),
      type: MenuItemType.Link,
      tooltip: T('Reports'),
      icon: iconMarker('ix-desktop-reporting'),
      iconActive: iconMarker('ix-desktop-reporting-active'),
      state: 'reportsdashboard/cpu',
    },
    {
      name: T('System'),
      type: MenuItemType.SlideOut,
      tooltip: T('System'),
      icon: iconMarker('ix-desktop-system'),
      iconActive: iconMarker('ix-desktop-system-active'),
      state: 'system',
      sub: [
        { name: T('Update'), state: 'update' },
        { name: T('General Settings'), state: 'general' },
        { name: T('Advanced Settings'), state: 'advanced' },
        { name: T('Network'), state: 'network' },
        { name: T('Boot'), state: 'boot' },
        { name: T('Services'), state: 'services' },
        {
          name: T('Shell'),
          state: 'shell',
          hasAccess$: this.authService.user$.pipe(map((user) => !!user?.privilege?.web_shell)),
        },
        { name: T('Alert Settings'), state: 'alert-settings' },
        { name: T('Audit'), state: 'audit' },
        { name: T('Enclosure'), state: 'viewenclosure', isVisible$: this.license.hasEnclosure$ },
      ],
    },
  ];
}

import { Injectable, inject } from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { tnIconMarker } from '@truenas/ui-components';
import { map } from 'rxjs/operators';
import { MenuItem, MenuItemType } from 'app/interfaces/menu-item.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { LicenseService } from 'app/services/license.service';

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
      icon: tnIconMarker('app-desktop-dashboard', 'custom'),
      iconActive: tnIconMarker('app-desktop-dashboard-active', 'custom'),
      state: 'dashboard',
    },
    {
      name: T('Storage'),
      type: MenuItemType.Link,
      tooltip: T('Storage'),
      icon: tnIconMarker('app-desktop-storage', 'custom'),
      iconActive: tnIconMarker('app-desktop-storage-active', 'custom'),
      state: 'storage',
    },
    {
      name: T('Datasets'),
      type: MenuItemType.Link,
      tooltip: T('Datasets'),
      icon: tnIconMarker('desktop-datasets', 'custom'),
      iconActive: tnIconMarker('desktop-datasets-active', 'custom'),
      state: 'datasets',
    },
    {
      name: T('File Manager'),
      type: MenuItemType.Link,
      tooltip: T('File Manager'),
      icon: tnIconMarker('desktop-file-manager', 'custom'),
      iconActive: tnIconMarker('desktop-file-manager-active', 'custom'),
      state: 'file-manager',
    },
    {
      name: T('Shares'),
      type: MenuItemType.Link,
      tooltip: T('Shares'),
      icon: tnIconMarker('desktop-shares', 'custom'),
      iconActive: tnIconMarker('desktop-shares-active', 'custom'),
      state: 'sharing',
    },
    {
      name: T('Data Protection'),
      type: MenuItemType.Link,
      tooltip: T('Data Protection'),
      icon: tnIconMarker('desktop-data-protection', 'custom'),
      iconActive: tnIconMarker('desktop-data-protection-active', 'custom'),
      state: 'data-protection',
    },
    {
      name: T('Credentials'),
      type: MenuItemType.SlideOut,
      tooltip: T('Credentials'),
      icon: tnIconMarker('desktop-credentials', 'custom'),
      iconActive: tnIconMarker('desktop-credentials-active', 'custom'),
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
      icon: tnIconMarker('desktop-virtual-machines', 'custom'),
      iconActive: tnIconMarker('desktop-virtual-machines-active', 'custom'),
      state: 'vm',
      isVisible$: this.license.hasVms$,
    },
    {
      name: T('Apps'),
      type: MenuItemType.Link,
      tooltip: T('Apps'),
      icon: tnIconMarker('desktop-apps', 'custom'),
      iconActive: tnIconMarker('desktop-apps-active', 'custom'),
      state: 'apps',
      isVisible$: this.license.hasApps$,
    },
    {
      name: T('Reporting'),
      type: MenuItemType.Link,
      tooltip: T('Reports'),
      icon: tnIconMarker('desktop-reporting', 'custom'),
      iconActive: tnIconMarker('desktop-reporting-active', 'custom'),
      state: 'reportsdashboard/cpu',
    },
    {
      name: T('System'),
      type: MenuItemType.SlideOut,
      tooltip: T('System'),
      icon: tnIconMarker('desktop-system', 'custom'),
      iconActive: tnIconMarker('desktop-system-active', 'custom'),
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

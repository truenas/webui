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
      icon: tnIconMarker('app-desktop-datasets', 'custom'),
      iconActive: tnIconMarker('app-desktop-datasets-active', 'custom'),
      state: 'datasets',
    },
    {
      name: T('File Manager'),
      type: MenuItemType.Link,
      tooltip: T('File Manager'),
      icon: tnIconMarker('app-desktop-file-manager', 'custom'),
      iconActive: tnIconMarker('app-desktop-file-manager-active', 'custom'),
      state: 'file-manager',
    },
    {
      name: T('Shares'),
      type: MenuItemType.Link,
      tooltip: T('Shares'),
      icon: tnIconMarker('app-desktop-shares', 'custom'),
      iconActive: tnIconMarker('app-desktop-shares-active', 'custom'),
      state: 'sharing',
    },
    {
      name: T('Data Protection'),
      type: MenuItemType.Link,
      tooltip: T('Data Protection'),
      icon: tnIconMarker('app-desktop-data-protection', 'custom'),
      iconActive: tnIconMarker('app-desktop-data-protection-active', 'custom'),
      state: 'data-protection',
    },
    {
      name: T('Credentials'),
      type: MenuItemType.SlideOut,
      tooltip: T('Credentials'),
      icon: tnIconMarker('app-desktop-credentials', 'custom'),
      iconActive: tnIconMarker('app-desktop-credentials-active', 'custom'),
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
      icon: tnIconMarker('app-desktop-virtual-machines', 'custom'),
      iconActive: tnIconMarker('app-desktop-virtual-machines-active', 'custom'),
      state: 'vm',
      isVisible$: this.license.hasVms$,
    },
    {
      name: T('Apps'),
      type: MenuItemType.Link,
      tooltip: T('Apps'),
      icon: tnIconMarker('app-desktop-apps', 'custom'),
      iconActive: tnIconMarker('app-desktop-apps-active', 'custom'),
      state: 'apps',
      isVisible$: this.license.hasApps$,
    },
    {
      name: T('Featured Photos'),
      type: MenuItemType.Link,
      tooltip: T('Featured Photos'),
      icon: tnIconMarker('app-featured-photos', 'custom'),
      iconActive: tnIconMarker('app-featured-photos-active', 'custom'),
      state: 'featured-photos/admin',
    },
    {
      name: T('Reporting'),
      type: MenuItemType.Link,
      tooltip: T('Reports'),
      icon: tnIconMarker('app-desktop-reporting', 'custom'),
      iconActive: tnIconMarker('app-desktop-reporting-active', 'custom'),
      state: 'reportsdashboard/cpu',
    },
    {
      name: T('System'),
      type: MenuItemType.SlideOut,
      tooltip: T('System'),
      icon: tnIconMarker('app-desktop-system', 'custom'),
      iconActive: tnIconMarker('app-desktop-system-active', 'custom'),
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

import { Injectable } from '@angular/core';
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
      name: T('Credentials'),
      type: MenuItemType.SlideOut,
      tooltip: T('Credentials'),
      icon: iconMarker('vpn_key'),
      state: 'credentials',
      sub: [
        { name: T('Users'), state: 'users' },
        { name: T('Users (WIP)'), state: 'users-new' },
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
    {
      name: T('Instances'),
      type: MenuItemType.Link,
      tooltip: T('Instances'),
      icon: iconMarker('mdi-laptop'),
      state: 'instances',
      isVisible$: this.license.hasVms$,
    },
    {
      name: T('Apps'),
      type: MenuItemType.Link,
      tooltip: T('Apps'),
      icon: iconMarker('apps'),
      state: 'apps',
      isVisible$: this.license.hasApps$,
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

  constructor(
    private license: LicenseService,
    private authService: AuthService,
  ) {}
}

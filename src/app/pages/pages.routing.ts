import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {AuthGuard} from './login/auth-guard.service';
import {Pages} from './pages.component';
// noinspection TypeScriptValidateTypes

// export function loadChildren(path) { return System.import(path); };

export const routes: Routes = [
  {path : 'login', loadChildren : 'app/pages/login/login.module#LoginModule'}, {
    path : 'pageNotFound',
    loadChildren :
        'app/pages/page-not-found/page-not-found.module#PageNotFoundModule'
  },
  {
    path : 'pages',
    component : Pages,
    canActivate : [ AuthGuard ],
    children : [
      {
        path : 'dashboard',
        loadChildren : 'app/pages/dashboard/dashboard.module#DashboardModule'
      },
      {
        path : 'system',
        loadChildren : 'app/pages/system/system.module#SystemModule'
      },
      {
        path : 'users',
        loadChildren : 'app/pages/users/users.module#UsersModule'
      },
      {
        path : 'groups',
        loadChildren : 'app/pages/groups/groups.module#GroupsModule'
      },
      {
        path : 'directoryservice',
        loadChildren :
            'app/pages/directoryservice/directoryservice.module#DirectoryServiceModule'
      },
      {
        path : 'network',
        loadChildren : 'app/pages/network/network.module#NetworkModule'
      },
      {
        path : 'storage/volumes',
        loadChildren : 'app/pages/storage/volumes/volumes.module#VolumesModule'
      },
      {
        path : 'storage/snapshots',
        loadChildren :
            'app/pages/storage/snapshots/snapshots.module#SnapshotsModule'
      },
      {
        path : 'sharing/webdav',
        loadChildren : 'app/pages/sharing/webdav/webdav.module#WebdavModule'
      },
      {
        path : 'sharing/afp',
        loadChildren : 'app/pages/sharing/afp/afp.module#AFPModule'
      },
      {
        path : 'sharing/nfs',
        loadChildren : 'app/pages/sharing/nfs/nfs.module#NFSModule'
      },
      {
        path : 'sharing/smb',
        loadChildren : 'app/pages/sharing/smb/smb.module#SMBModule'
      },
      {
        path : 'sharing/iscsi',
        loadChildren : 'app/pages/sharing/iscsi/iscsi.module#ISCSIModule'
      },
      {
        path : 'services',
        loadChildren : 'app/pages/services/services.module#ServicesModule'
      },
      {
        path : 'vm', 
        loadChildren : 'app/pages/vm/vm.module#VmModule'
      },
      {
        path : 'jails',
        loadChildren : 'app/pages/jails/jails.module#JailsModule'
      },
      {
        path : 'plugins',
        loadChildren : 'app/pages/plugin/plugin.module#PluginModule'
      },
      {
        path : '', 
        redirectTo : 'dashboard', 
        pathMatch : 'full'
      },
    ]
  }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);

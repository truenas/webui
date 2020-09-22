import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { GroupListComponent } from './groups/group-list/';
import { GroupFormComponent } from './groups/group-form/';
import { MembersComponent } from './groups/members/members.component';
import { UserListComponent } from './users/user-list/';
import { UserFormComponent } from './users/user-form/';
import { ChangePasswordComponent } from "./users/change-password/change-password.component";
import { TwoFactorComponent } from '../system/two-factor/two-factor.component';
import { DirectoryservicesComponent } from '../directoryservice/directoryservices/directoryservices.component';
import { CredentialsComponent } from './../credentials/credentials.component';
import { CloudCredentialsFormComponent } from '../system/CloudCredentials/cloudcredentials-form/cloudcredentials-form.component';
import { CloudCredentialsListComponent } from '../system/CloudCredentials/CloudCredentials-list/CloudCredentials-list.component';
import { SshConnectionsListComponent } from '../system/ssh-connections/ssh-connections-list/ssh-connections-list.component';
import { SshConnectionsFormComponent } from '../system/ssh-connections/ssh-connections-form/ssh-connections-form.component';
import { SshKeypairsListComponent } from '../system/ssh-keypairs/ssh-keypairs-list/ssh-keypairs-list.component';
import { SshKeypairsFormComponent } from '../system/ssh-keypairs/ssh-keypairs-form/ssh-keypairs-form.component';

import { T } from '../../translate-marker';

export const routes: Routes = [{
  path: '',
  data: { title: 'Accounts' },
  children: [
  {
    path: 'users',
    data: { title: 'Users', breadcrumb: 'Users', icon: 'group' },
    children: [{
        path: '',
        component: UserListComponent,
        data: { title: 'Users', breadcrumb: 'Users' },
      }, {
        path: 'add',
        component: UserFormComponent,
        data: { title: 'Add', breadcrumb: 'Add' },
      },
      {
        path: 'edit/:pk',
        component: UserFormComponent,
        data: { title: 'Edit', breadcrumb: 'Edit' },
      },{
        path: 'change-password',
        component: ChangePasswordComponent,
        data: { title: 'Change Password', breadcrumb: 'Change Password' },
      }
    ]
  }, {
    path: 'groups',
    data: { title: 'Groups', breadcrumb: 'Groups', icon: 'group_work' },
    children: [{
        path: '',
        component: GroupListComponent,
        data: { title: 'Groups', breadcrumb: 'Groups' },
      }, {
        path: 'add',
        component: GroupFormComponent,
        data: { title: 'Add', breadcrumb: 'Add' },
      },
      {
        path: 'edit/:pk',
        component: GroupFormComponent,
        data: { title: 'Edit', breadcrumb: 'Edit' },
      }, {
        path: 'members/:pk',
        component: MembersComponent,
        data: {title: 'Update Members', breadcrumb: 'Members'}
      }
    ]
  },
  {
    path: 'two-factor',
    component: TwoFactorComponent,
    data: { title: ('Two-Factor Auth'), breadcrumb: ('Two-Factor Auth') },
  },

  // Temporary dashboards attached to accounts for now
  {
    path: 'directory-services',
    component: DirectoryservicesComponent,
    data: { title: ('Directory Services') },
  },
  {
    path: 'sshconnections',
    data: { title: T('SSH Connections'), breadcrumb: T('SSH Connections'), icon: 'cloud_circle'},
    children: [
      {
        path: '',
        component: SshConnectionsListComponent,
        data: { title: T('SSH Connections'), breadcrumb: T('SSH Connections'), icon: 'cloud_circle'},
      },
      {
        path: 'add',
        component: SshConnectionsFormComponent,
        data: { title: T('Add'), breadcrumb: T('Add') },
      },
      {
        path: 'edit/:pk',
        component: SshConnectionsFormComponent,
        data: { title: T('Edit'), breadcrumb: T('Edit') },
      }]
    },
    {
      path: 'sshkeypairs',
      data: { title: T('SSH Keypairs'), breadcrumb: T('SSH Keypairs'), icon: 'vpn_key' },
      children: [{
        path: '',
        component: SshKeypairsListComponent,
        data: { title: T('SSH Keypairs'), breadcrumb: T('SSH Keypairs') },
      }, {
        path: 'add',
        component: SshKeypairsFormComponent,
        data: { title: T('Add'), breadcrumb: T('Add') },
      }, {
        path: 'edit/:pk',
        component: SshKeypairsFormComponent,
        data: { title: T('Edit'), breadcrumb: T('Edit') },
      }
    ]
  },
  {
    path: 'cloudcredentials',
    data: { title: T('Cloud Credentials'), breadcrumb: T('Cloud Credentials'), icon: 'cloud_circle' },
    children: [{
        path: '',
        component: CloudCredentialsListComponent,
        data: { title: T('Cloud Credentials'), breadcrumb: T('Cloud Credentials') },
      },
      {
        path: 'add',
        component: CloudCredentialsFormComponent,
        data: { title: T('Add'), breadcrumb: T('Add') },
      },
      {
        path: 'edit/:pk',
        component: CloudCredentialsFormComponent,
        data: { title: T('Edit'), breadcrumb: T('Edit') },
      },
    ]
  },
  {
    path: 'temp-misc',
    component: CredentialsComponent,
    data: { title: ('Miscellaneous'), breadcrumb: T('Miscellaneous') }
  }
]
}];
export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
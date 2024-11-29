import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import {
  AuthorizedAccessListComponent,
} from 'app/pages/sharing/iscsi/authorized-access/authorized-access-list/authorized-access-list.component';
import { ExtentListComponent } from 'app/pages/sharing/iscsi/extent/extent-list/extent-list.component';
import { FibreChannelPortsComponent } from 'app/pages/sharing/iscsi/fibre-channel-ports/fibre-channel-ports.component';
import { InitiatorFormComponent } from 'app/pages/sharing/iscsi/initiator/initiator-form/initiator-form.component';
import { InitiatorListComponent } from 'app/pages/sharing/iscsi/initiator/initiator-list/initiator-list.component';
import { IscsiComponent } from 'app/pages/sharing/iscsi/iscsi.component';
import { PortalListComponent } from 'app/pages/sharing/iscsi/portal/portal-list/portal-list.component';
import { AllTargetsComponent } from 'app/pages/sharing/iscsi/target/all-targets/all-targets.component';

export const iscsiRoutes: Routes = [
  {
    path: '',
    component: IscsiComponent,
    data: { title: 'iSCSI', breadcrumb: null },
    children: [
      {
        path: '',
        redirectTo: 'targets',
        pathMatch: 'full',
      },
      {
        path: 'targets',
        data: { title: T('Targets'), breadcrumb: T('Targets') },
        component: AllTargetsComponent,
      },
      {
        path: 'extents',
        data: { title: T('Extents'), breadcrumb: T('Extents') },
        component: ExtentListComponent,
      },
      {
        path: 'initiators',
        data: { title: T('Initiators'), breadcrumb: T('Initiators') },
        children: [
          {
            path: '',
            pathMatch: 'full',
            component: InitiatorListComponent,
          },
        ],
      },
      {
        path: 'portals',
        data: { title: T('Portals'), breadcrumb: T('Portals') },
        component: PortalListComponent,
      },
      {
        path: 'authorized-access',
        data: { title: T('Authorized Access'), breadcrumb: T('Authorized Access') },
        component: AuthorizedAccessListComponent,
      },
      {
        path: 'fibre-channel-ports',
        data: { title: T('Fibre Channel Ports'), breadcrumb: T('Fibre Channel Ports') },
        component: FibreChannelPortsComponent,
      },
    ],
  },
  {
    path: 'initiators/add',
    component: InitiatorFormComponent,
    data: { title: T('Add Initiator'), breadcrumb: T('Add') },
  },
  {
    path: 'initiators/edit/:pk',
    component: InitiatorFormComponent,
    data: { title: T('Add Initiator'), breadcrumb: T('Edit') },
  },
];

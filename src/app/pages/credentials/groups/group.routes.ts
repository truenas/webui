import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { GroupListComponent } from 'app/pages/credentials/groups/group-list/group-list.component';
import { GroupMembersComponent } from 'app/pages/credentials/groups/group-members/group-members.component';

export const groupRoutes: Routes = [
  {
    path: '',
    component: GroupListComponent,
    data: { title: T('Groups'), breadcrumb: T('Groups') },
  },
  {
    path: ':pk/members',
    component: GroupMembersComponent,
    data: { title: T('Update Members'), breadcrumb: T('Members') },
  },
];

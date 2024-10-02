import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { AuditComponent } from 'app/pages/audit/audit.component';

export const auditRoutes: Routes = [
  {
    path: '',
    data: { title: T('Audit') },
    component: AuditComponent,
    pathMatch: 'full',
  },
  {
    path: ':options',
    data: {
      title: T('Audit'),
    },
    component: AuditComponent,
    pathMatch: 'full',
  },
];

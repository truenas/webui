import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { AuditComponent } from 'app/pages/audit/components/audit/audit.component';

export const routes: Routes = [
  {
    path: '',
    data: { title: T('Audit') },
    component: AuditComponent,
    pathMatch: 'full',
  },
  {
    path: ':options',
    data: { title: T('Audit') },
    component: AuditComponent,
    pathMatch: 'full',
  },
];
export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);

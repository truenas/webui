import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UnauthorizedComponent } from 'app/pages/unauthorized/unauthorized/unauthorized.component';

export const routes: Routes = [
  {
    path: '',
    data: { title: T('Unauthorized Access'), breadcrumb: null },
    component: UnauthorizedComponent,
  },
];
export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);

import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TwoFactorComponent } from 'app/pages/two-factor-auth/components/two-factor/two-factor.component';

export const routes: Routes = [
  {
    path: '',
    data: { title: T('Two-Factor Authentication'), breadcrumb: T('Two-Factor Authentication') },
    component: TwoFactorComponent,
  },
];
export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);

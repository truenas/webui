import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TwoFactorComponent } from 'app/pages/two-factor-auth/components/two-factor/two-factor.component';

export const routes: Routes = [
  {
    path: '',
    data: { title: 'Two-Factor Authentication', breadcrumb: 'Two-Factor Authentication' },
    component: TwoFactorComponent,
  },
];
export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);

import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TwoFactorAuthFormComponent } from 'app/pages/two-factor-auth/components/two-factor-auth-form/two-factor-auth-form.component';

export const routes: Routes = [
  {
    path: '',
    data: { title: 'Two-Factor Authentication', breadcrumb: 'Two-Factor Authentication' },
    component: TwoFactorAuthFormComponent,
  },
];
export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);

import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DataProtectionComingsoonComponent } from './data-protection-comingsoon/data-protection-comingsoon.component';

export const routes: Routes = [
  {
    path: '',
    data: { title: 'Data Protection', breadcrumb: 'Data Protection' },
    component: DataProtectionComingsoonComponent
  },
  
]
export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
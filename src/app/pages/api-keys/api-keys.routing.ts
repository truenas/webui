import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ApiKeysComponent } from 'app/pages/api-keys/components/api-keys/api-keys.component';

export const routes: Routes = [{
  path: '',
  component: ApiKeysComponent,
  data: { title: 'API Keys', breadcrumb: 'API Keys' },
}];
export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);

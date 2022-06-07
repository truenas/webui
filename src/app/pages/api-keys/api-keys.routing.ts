import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ApiKeyListComponent } from 'app/pages/api-keys/components/api-key-list/api-key-list.component';

export const routes: Routes = [{
  path: '',
  component: ApiKeyListComponent,
  data: { title: 'API Keys', breadcrumb: 'API Keys' },
}];
export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);

import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { ApiKeyListComponent } from 'app/pages/api-keys/components/api-key-list/api-key-list.component';

export const routes: Routes = [{
  path: '',
  component: ApiKeyListComponent,
  data: { title: T('API Keys'), breadcrumb: T('API Keys') },
}];
export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);

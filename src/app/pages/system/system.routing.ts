import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {AdvancedComponent} from './advanced/';

export const routes: Routes = [
  {path : 'advanced', component : AdvancedComponent}
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);

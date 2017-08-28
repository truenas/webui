import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {AdvancedComponent} from './advanced/';

export const routes: Routes = [
  {path : '', component : AdvancedComponent}
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);

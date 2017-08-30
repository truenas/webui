import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {AdvancedComponent} from './advanced/';
import {GeneralComponent} from './general/';

export const routes: Routes = [
	{path : '', component : GeneralComponent },
	{path : '', component : AdvancedComponent }
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);

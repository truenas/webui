import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {SnapshotAddComponent} from './snapshot-add/';
import {SnapshotCloneComponent} from './snapshot-clone/';
import {SnapshotDeleteComponent} from './snapshot-delete/';
import {SnapshotListComponent} from './snapshot-list/';
import {SnapshotRollbackComponent} from './snapshot-rollback/';

export const routes: Routes = [
  {path : 'delete/:pk', component : SnapshotDeleteComponent},
  {path : 'clone/:pk', component : SnapshotCloneComponent},
  {path : 'rollback/:pk', component : SnapshotRollbackComponent},
  {path : 'id/:pk/add', component : SnapshotAddComponent},
  {path : '', component : SnapshotListComponent, pathMatch : 'full'}
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);

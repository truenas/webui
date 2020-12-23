import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ApplicationsComponent } from './applications.component';
import { PodShellComponent } from './pod-shell/pod-shell.component';

const routes: Routes = [
  {
    path : '',
    component : ApplicationsComponent,
    children: [{
      path: 'shell/:rname/:pname/:cname',
      component: PodShellComponent,
      data: { title: 'Shell', breadcrumb: 'Shell' },
    }]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ApplicationsRoutingModule { }

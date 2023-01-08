import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { ApplicationsComponent } from './applications.component';
import { PodLogsComponent } from './pod-logs/pod-logs.component';
import { PodShellComponent } from './pod-shell/pod-shell.component';

const routes: Routes = [
  {
    path: '',
    component: ApplicationsComponent,
    children: [],
  }, {
    path: 'shell/:rname/:pname/:cname',
    component: PodShellComponent,
    data: { title: T('Pod Shell'), breadcrumb: T('Pod Shell') },
  }, {
    path: 'logs/:rname/:pname/:cname/:tail_lines',
    component: PodLogsComponent,
    data: { title: T('Pod Logs'), breadcrumb: T('Pod Logs') },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ApplicationsRoutingModule { }

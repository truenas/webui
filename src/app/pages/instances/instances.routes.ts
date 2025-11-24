import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { AllContainersComponent } from 'app/pages/instances/components/all-containers/all-containers.component';
import {
  ContainerConsoleComponent,
} from 'app/pages/instances/components/container-shell/container-console.component';
import { ContainerShellComponent } from 'app/pages/instances/components/container-shell/container-shell.component';
import { ContainerConfigStore } from 'app/pages/instances/stores/container-config.store';
import { ContainerDevicesStore } from 'app/pages/instances/stores/container-devices.store';
import { ContainerInstancesStore } from 'app/pages/instances/stores/container-instances.store';

export const instancesRoutes: Routes = [{
  path: '',
  data: { title: T('Containers'), breadcrumb: null },
  providers: [
    ContainerConfigStore,
    ContainerInstancesStore,
    ContainerDevicesStore,
  ],
  children: [
    {
      path: '',
      component: AllContainersComponent,
    },
    {
      path: 'view/:id',
      data: { title: T('Containers'), breadcrumb: null },
      children: [
        {
          path: '',
          pathMatch: 'full',
          component: AllContainersComponent,
        },
        {
          path: 'shell',
          component: ContainerShellComponent,
          data: { title: T('Container Shell') },
        },
        {
          path: 'console',
          component: ContainerConsoleComponent,
          data: { title: T('Container Console') },
        },
      ],
    },
  ],
}];

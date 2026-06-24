import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { ContainerStatus } from 'app/enums/container.enum';
import { Container } from 'app/interfaces/container.interface';
import {
  ContainerToolsComponent,
} from 'app/pages/containers/components/all-containers/container-details/container-tools/container-tools.component';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';
import { fakeContainer } from 'app/pages/containers/utils/fake-container.utils';

describe('ContainerToolsComponent', () => {
  let spectator: Spectator<ContainerToolsComponent>;

  const runningContainer = fakeContainer({
    id: 1,
    status: { state: ContainerStatus.Running, pid: 123, domain_state: null },
  });

  const selectedContainer = signal<Container>(runningContainer);

  const createComponent = createComponentFactory({
    component: ContainerToolsComponent,
    providers: [
      mockProvider(ContainersStore, { selectedContainer }),
      mockProvider(Router, { navigate: jest.fn() }),
    ],
  });

  beforeEach(() => {
    selectedContainer.set(runningContainer);
    spectator = createComponent();
  });

  describe('shell', () => {
    it('shows a Shell row with a trailing icon', () => {
      expect(spectator.query('tn-list-item')).toHaveText('Shell');
      expect(spectator.query('tn-icon')).toBeTruthy();
    });

    it('navigates to the shell when the Shell row is clicked', () => {
      spectator.click('tn-list-item');

      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/containers', 'view', 1, 'shell']);
    });

    it('does not navigate when the container is not running', () => {
      selectedContainer.set(fakeContainer({
        id: 1,
        status: { state: ContainerStatus.Stopped, pid: null, domain_state: null },
      }));
      spectator.detectChanges();

      spectator.click('tn-list-item');

      expect(spectator.inject(Router).navigate).not.toHaveBeenCalled();
    });
  });
});

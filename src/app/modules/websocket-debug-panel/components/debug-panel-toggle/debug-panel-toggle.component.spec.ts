import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { DebugPanelToggleComponent } from './debug-panel-toggle.component';

describe('DebugPanelToggleComponent', () => {
  let spectator: Spectator<DebugPanelToggleComponent>;
  const createComponent = createComponentFactory({
    component: DebugPanelToggleComponent,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });
});

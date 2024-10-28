import { MatProgressSpinner, MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { VirtualizationGlobalState } from 'app/enums/virtualization.enum';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { VirtualizationStateComponent } from './virtualization-state.component';

describe('VirtualizationStateComponent', () => {
  let spectator: Spectator<VirtualizationStateComponent>;
  const createComponent = createComponentFactory({
    component: VirtualizationStateComponent,
    imports: [
      MatProgressSpinnerModule,
    ],
    declarations: [
      MockComponents(
        IxIconComponent,
        MatProgressSpinner,
      ),
    ],
  });

  it('should display "Pool is not selected" with settings icon when state is NoPool', () => {
    spectator = createComponent({
      props: {
        state: VirtualizationGlobalState.NoPool,
      },
    });

    const icon = spectator.query(IxIconComponent);
    expect(icon.name).toBe('settings');
    expect(spectator.query('.status-text')).toHaveText('Pool is not selected');
  });

  it('should display "Initialized" with check icon when state is Initialized', () => {
    spectator = createComponent({
      props: {
        state: VirtualizationGlobalState.Initialized,
      },
    });

    const icon = spectator.query(IxIconComponent);
    expect(icon.name).toBe('check');
    expect(spectator.query('.status-text')).toHaveText('Initialized');
  });

  it('should display "Dataset is locked" with lock icon when state is Locked', () => {
    spectator = createComponent({
      props: {
        state: VirtualizationGlobalState.Locked,
      },
    });

    const icon = spectator.query(IxIconComponent);
    expect(icon.name).toBe('mdi-lock');
    expect(spectator.query('.status-text')).toHaveText('Dataset is locked');
  });

  it('should display "Error" with mdi-close icon when state is Error', () => {
    spectator = createComponent({
      props: {
        state: VirtualizationGlobalState.Error,
      },
    });

    const icon = spectator.query(IxIconComponent);
    expect(icon.name).toBe('mdi-close');
    expect(spectator.query('.status-text')).toHaveText('Error');
  });

  it('should display "Initializing..." with spinner when state is Initializing', () => {
    spectator = createComponent({
      props: {
        state: VirtualizationGlobalState.Initializing,
      },
    });

    const spinner = spectator.query(MatProgressSpinner);
    expect(spinner).toBeTruthy();
    expect(spinner.diameter).toBe(24);
    expect(spectator.query('.status-text')).toHaveText('Initializing...');
  });
});

import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { mockProvider, Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { Subject } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { ChainedRef } from 'app/modules/slide-ins/chained-component-ref';
import { ModalHeader2Component } from 'app/modules/slide-ins/components/modal-header2/modal-header2.component';
import { CloudBackupFormComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-form/cloud-backup-form.component';
import { CloudSyncWizardComponent } from 'app/pages/data-protection/cloudsync/cloudsync-wizard/cloudsync-wizard.component';
import { ChainedComponentResponse, ChainedComponentSerialized, ChainedSlideInService } from 'app/services/chained-slide-in.service';

describe('ModalHeader2Component', () => {
  let spectator: Spectator<ModalHeader2Component>;
  const components$ = new Subject<ChainedComponentSerialized[]>();
  const closeSubject$ = new Subject<ChainedComponentResponse>();
  const backSubject$ = new Subject<ChainedComponentResponse>();
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: ModalHeader2Component,
    declarations: [
      MockComponent(CloudSyncWizardComponent),
    ],
    providers: [
      mockAuth(),
      mockProvider(ChainedSlideInService, {
        components$,
      }),
      mockProvider(ChainedRef, {
        close: jest.fn(),
        getData: jest.fn(() => undefined),
        swap: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        title: 'Add Cloudsync Task',
        loading: false,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows proper title', () => {
    const title = spectator.query('.ix-form-title');
    expect(title.textContent).toBe(' Add Cloudsync Task ');
  });

  it('shows a working close button when only 1 component is in the queue', async () => {
    const closeButton = await loader.getHarness(MatButtonHarness.with({ selector: '#ix-close-icon' }));
    await closeButton.click();
    expect(spectator.inject(ChainedRef).close).toHaveBeenCalledWith({ response: false, error: null });
    const icon = spectator.query(IxIconComponent);
    expect(icon.name()).toBe('cancel');
  });

  it('shows a working back button when more than 1 component is in the queue', async () => {
    components$.next([{
      id: 'id',
      component: CloudSyncWizardComponent,
      close$: closeSubject$,
      data: undefined,
      wide: false,
    }, {
      id: 'id2',
      component: CloudBackupFormComponent,
      close$: backSubject$,
      data: undefined,
      wide: false,
    }] as ChainedComponentSerialized[]);
    spectator.detectChanges();
    const closeButton = await loader.getHarness(MatButtonHarness.with({ selector: '#ix-close-icon' }));
    await closeButton.click();
    expect(spectator.inject(ChainedRef).close).toHaveBeenCalledWith({ response: false, error: null });
    const icon = spectator.query(IxIconComponent);
    expect(icon.name()).toBe('mdi-chevron-left');
  });
});

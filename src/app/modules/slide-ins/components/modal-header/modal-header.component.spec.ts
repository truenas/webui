import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { mockProvider, Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { Subject } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ComponentSerialized, SlideInResponse } from 'app/modules/slide-ins/slide-in.interface';
import { CloudBackupFormComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-form/cloud-backup-form.component';
import { CloudSyncWizardComponent } from 'app/pages/data-protection/cloudsync/cloudsync-wizard/cloudsync-wizard.component';

describe('ModalHeader2Component', () => {
  let spectator: Spectator<ModalHeaderComponent>;
  const components$ = new Subject<ComponentSerialized[]>();
  const closeSubject$ = new Subject<SlideInResponse>();
  const backSubject$ = new Subject<SlideInResponse>();
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: ModalHeaderComponent,
    declarations: [
      MockComponent(CloudSyncWizardComponent),
    ],
    providers: [
      mockAuth(),
      mockProvider(SlideIn, {
        components$,
      }),
      mockProvider(SlideInRef, {
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
    const title = spectator.query('.ix-form-title')!;
    expect(title.textContent).toBe(' Add Cloudsync Task ');
  });

  it('shows a working close button when only 1 component is in the queue', async () => {
    const closeButton = await loader.getHarness(MatButtonHarness.with({ selector: '#ix-close-icon' }));
    await closeButton.click();
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({ response: false, error: null });
    const icon = spectator.query(IxIconComponent)!;
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
    }] as ComponentSerialized[]);
    spectator.detectChanges();
    const closeButton = await loader.getHarness(MatButtonHarness.with({ selector: '#ix-close-icon' }));
    await closeButton.click();
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({ response: false, error: null });
    const icon = spectator.query(IxIconComponent)!;
    expect(icon.name()).toBe('mdi-chevron-left');
  });
});

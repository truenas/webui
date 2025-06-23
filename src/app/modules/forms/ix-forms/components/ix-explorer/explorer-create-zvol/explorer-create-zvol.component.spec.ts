import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { FormControl, NgControl } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { BehaviorSubject, of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ZvolFormComponent } from 'app/pages/datasets/components/zvol-form/zvol-form.component';
import { ExplorerCreateZvolComponent } from './explorer-create-zvol.component';

describe('ExplorerCreateZvolComponent', () => {
  let spectator: Spectator<ExplorerCreateZvolComponent>;

  const fakeExplorer = {
    isDisabled: signal(false),

    lastSelectedNode: signal({
      data: {
        path: '/dev/zvol/test-pool',
        type: ExplorerNodeType.Directory,
      },
    }),

    refreshNode: jest.fn(),
  } as unknown as IxExplorerComponent;

  const fakeControl = {
    valueChanges: new BehaviorSubject(''),
    control: new FormControl(''),
  };

  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: ExplorerCreateZvolComponent,
    providers: [
      mockAuth(),
      mockProvider(SlideIn, {
        open: jest.fn(() => of({ response: { id: 'test-pool/test-zvol' } })),
      }),
      {
        provide: NgControl,
        useValue: fakeControl,
      },
      {
        provide: IxExplorerComponent,
        useValue: fakeExplorer,
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();

    jest.spyOn(fakeControl.control, 'setValue');

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);

    fakeControl.control.setValue('/dev/zvol/test-pool');
  });

  it('opens ZvolFormComponent when Create Zvol button is pressed', async () => {
    const createButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create Zvol' }));
    await createButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(ZvolFormComponent, {
      data: {
        isNew: true,
        parentOrZvolId: 'test-pool',
      },
    });

    expect(fakeExplorer.refreshNode).toHaveBeenCalled();
    expect(fakeControl.control.setValue).toHaveBeenCalledWith('/dev/zvol/test-pool/test-zvol');
  });
});

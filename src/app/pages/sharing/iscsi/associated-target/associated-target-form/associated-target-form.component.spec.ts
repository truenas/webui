import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IscsiTargetExtent } from 'app/interfaces/iscsi.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { IscsiService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { AssociatedTargetFormComponent } from './associated-target-form.component';

describe('AssociatedTargetFormComponent', () => {
  let spectator: Spectator<AssociatedTargetFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const existingAssociatedTarget = {
    id: 12,
    target: 2,
    lunid: 15,
    extent: 2,
  } as IscsiTargetExtent;

  const createComponent = createComponentFactory({
    component: AssociatedTargetFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(IscsiService, {
        getTargets: () => of([
          { id: 1, name: 'target-1' },
          { id: 2, name: 'target-2' },
        ]),
        getExtents: () => of([
          { id: 1, name: 'extent-1' },
          { id: 2, name: 'extent-2' },
        ]),
      }),
      mockProvider(IxSlideInService),
      mockWebsocket([
        mockCall('iscsi.targetextent.create'),
        mockCall('iscsi.targetextent.update'),
      ]),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('add new associated target when form is submitted', async () => {
    await form.fillForm({
      Target: 'target-1',
      'LUN ID': 234,
      Extent: 'extent-1',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('iscsi.targetextent.create', [{
      extent: 1,
      lunid: 234,
      target: 1,
    }]);
    expect(spectator.inject(IxSlideInService).close).toHaveBeenCalled();
  });

  it('shows values for an existing associated target when form is opened for edit', async () => {
    spectator.component.setTargetForEdit(existingAssociatedTarget);

    const values = await form.getValues();
    expect(values).toEqual({
      Extent: 'extent-2',
      'LUN ID': '15',
      Target: 'target-2',
    });
  });

  it('edits existing associated target when form opened for edit is submitted', async () => {
    spectator.component.setTargetForEdit(existingAssociatedTarget);

    await form.fillForm({
      Target: 'target-1',
      'LUN ID': 234,
      Extent: 'extent-1',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith(
      'iscsi.targetextent.update',
      [
        12,
        {
          extent: 1,
          lunid: 234,
          target: 1,
        },
      ],
    );
    expect(spectator.inject(IxSlideInService).close).toHaveBeenCalled();
  });
});

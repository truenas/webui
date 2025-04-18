import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createHostFactory, SpectatorHost } from '@ngneat/spectator/jest';
import {
  EditableSaveOnEnterDirective,
} from 'app/modules/forms/editable/editable-save-on-enter/editable-save-on-enter.directive';
import { EditableComponent } from 'app/modules/forms/editable/editable.component';
import { EditableHarness } from 'app/modules/forms/editable/editable.harness';

describe('EditableSaveOnEnterDirective', () => {
  let spectator: SpectatorHost<EditableComponent>;
  let editableHarness: EditableHarness;

  const createHost = createHostFactory({
    component: EditableComponent,
    imports: [
      EditableSaveOnEnterDirective,
    ],
  });

  beforeEach(async () => {
    spectator = createHost(
      `
      <ix-editable>
        <div view></div>
        <div edit>
          <input editableSaveOnEnter />
        </div>
      </ix-editable>
      `,
    );

    const loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    editableHarness = await loader.getHarness(EditableHarness);
  });

  it('attempts to close the parent editable when Enter is pressed', async () => {
    jest.spyOn(spectator.component, 'tryToClose').mockImplementation();

    await editableHarness.open();

    spectator.keyboard.pressEnter('input');

    expect(spectator.component.tryToClose).toHaveBeenCalled();
  });
});

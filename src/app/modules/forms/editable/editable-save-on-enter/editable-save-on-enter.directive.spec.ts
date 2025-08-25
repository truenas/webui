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
    // Mock scrollIntoView since it's not available in test environment
    Element.prototype.scrollIntoView = jest.fn();

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

    const input = spectator.query('input') as HTMLInputElement;
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    input.dispatchEvent(enterEvent);

    expect(spectator.component.tryToClose).toHaveBeenCalled();
  });
});

import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { IxIconGroupHarness } from 'app/modules/ix-forms/components/ix-icon-group/ix-icon-group.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import {
  WidgetEditorGroupComponent,
} from 'app/pages/dashboard/components/widget-group-form/widget-editor-group/widget-editor-group.component';
import { WidgetGroupLayout } from 'app/pages/dashboard/types/widget-group.interface';

describe('WidgetEditorGroupComponent', () => {
  // TODO:
  // eslint-disable-next-line unused-imports/no-unused-vars
  let spectator: Spectator<WidgetEditorGroupComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: WidgetEditorGroupComponent,
    imports: [ReactiveFormsModule, IxFormsModule, MatIconTestingModule],
    declarations: [],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('checks layout selector', async () => {
    const layoutSelector = await loader.getHarness(IxIconGroupHarness.with({ label: 'Layouts' }));
    await layoutSelector.setValue(WidgetGroupLayout.Halves);

    expect(await layoutSelector.getValue()).toEqual(WidgetGroupLayout.Halves);
  });

  // TODO:
  /* eslint-disable jest/expect-expect */
  it('renders correct group layout based on group layout field', () => {

  });

  it('renders widgets in correct slots and assigns their settings', () => {

  });

  describe('selection', () => {
    it('shows slot as selected when [selection] input is changed', () => {

    });

    it('shows slot as selected and emits selectionChange with slot number when slot is clicked', () => {

    });
  });

  it('defaults to selecting first slot on init', () => {

  });

  it('renders "Empty" when widget slot is empty', () => {

  });

  it('renders "Empty" when widget does not support slot size', () => {

  });

  it('renders Unknown widget type "name" when widget is not recognized', () => {

  });
});

import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import {
  WidgetEditorGroupComponent,
} from 'app/pages/dashboard/components/widget-group-form/widget-editor-group/widget-editor-group.component';

describe('WidgetEditorGroupComponent', () => {
  // TODO:
  // eslint-disable-next-line unused-imports/no-unused-vars
  let spectator: Spectator<WidgetEditorGroupComponent>;
  const createComponent = createComponentFactory({
    component: WidgetEditorGroupComponent,
    declarations: [],
  });

  beforeEach(() => {
    spectator = createComponent();
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

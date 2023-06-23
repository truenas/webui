import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { IxTable2Component } from 'app/modules/ix-table2/components/ix-table2/ix-table2.component';

describe('IxTable2Component', () => {
  let spectator: Spectator<IxTable2Component>;

  const createComponent = createComponentFactory({
    component: IxTable2Component,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create the component', () => {
    expect(spectator.component).toBeTruthy();
  });
});

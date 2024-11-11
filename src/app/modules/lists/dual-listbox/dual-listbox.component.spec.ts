import { MatButtonModule } from '@angular/material/button';
import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { TranslateModule } from '@ngx-translate/core';
import { MockComponent } from 'ng-mocks';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { DualListBoxComponent } from './dual-listbox.component';

describe('DualListBoxComponent', () => {
  let spectator: Spectator<DualListBoxComponent>;
  const createComponent = createComponentFactory({
    component: DualListBoxComponent,
    imports: [MatButtonModule, TranslateModule.forRoot()],
    declarations: [
      MockComponent(IxIconComponent),
    ],
    providers: [],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        sourceName: 'Available Items',
        targetName: 'Selected Items',
        source: [{ _id: 1, _name: 'Item 1' }, { _id: 2, _name: 'Item 2' }],
        destination: [],
        sort: true,
      },
    });
  });

  it('should display source and target names correctly', () => {
    expect(spectator.query('p')).toHaveText('Available Items');
    expect(spectator.queryAll('p')[1]).toHaveText('Selected Items');
  });

  it('should call selectItem when an item is clicked', () => {
    const selectItemSpy = jest.spyOn(spectator.component, 'selectItem');
    const listItemElement = spectator.query('mat-list-item', { root: true });

    spectator.click(listItemElement);

    const available = spectator.component.available;

    expect(selectItemSpy).toHaveBeenCalledWith(available.pick, available.sift[0]);
  });

  it('should move selected items from available to confirmed and from confirmed to available', () => {
    spectator.component.selectItem(spectator.component.available.pick, spectator.component.available.sift[0]);
    spectator.component.moveItem(spectator.component.available, spectator.component.confirmed);

    spectator.detectChanges();

    expect(spectator.component.confirmed.sift).toContainEqual({ _id: 1, _name: 'Item 1' });
    expect(spectator.component.available.sift).toContainEqual({ _id: 2, _name: 'Item 2' });
    expect(spectator.component.confirmed.sift).toHaveLength(1);
    expect(spectator.component.available.sift).toHaveLength(1);

    spectator.component.selectItem(spectator.component.confirmed.pick, spectator.component.confirmed.sift[0]);
    spectator.component.moveItem(spectator.component.confirmed, spectator.component.available);

    spectator.detectChanges();

    expect(spectator.component.confirmed.sift).toHaveLength(0);
    expect(spectator.component.available.sift).toHaveLength(2);
    expect(spectator.component.available.sift).toEqual([{ _id: 1, _name: 'Item 1' }, { _id: 2, _name: 'Item 2' }]);
  });

  it('should move all items from available to confirmed and from confirmed to available', () => {
    spectator.component.moveAll();

    spectator.detectChanges();

    expect(spectator.component.available.sift).toHaveLength(0);
    expect(spectator.component.confirmed.sift).toHaveLength(2);

    spectator.component.removeAll();

    spectator.detectChanges();

    expect(spectator.component.available.sift).toHaveLength(2);
    expect(spectator.component.confirmed.sift).toHaveLength(0);
  });
});

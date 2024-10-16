import { Signal, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormControl } from '@ngneat/reactive-forms';
import { createHostFactory, SpectatorHost } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { Option } from 'app/interfaces/option.interface';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { FilterSelectListComponent } from 'app/pages/apps/components/filter-select-list/filter-select-list.component';

describe('FilterSelectListComponent', () => {
  let spectator: SpectatorHost<FilterSelectListComponent>;
  let control: FormControl<string | string[]>;
  const options: Signal<Option[]> = signal([
    { label: 'label1', value: 'value1' },
    { label: 'label2', value: 'value2' },
    { label: 'label3', value: 'value3' },
  ]);
  const createHost = createHostFactory({
    component: FilterSelectListComponent,
    imports: [
      ReactiveFormsModule,
    ],
    declarations: [
      MockComponent(IxErrorsComponent),
      MockComponent(IxIconComponent),
    ],
  });

  describe('ix-filter-select-list when multiple is false', () => {
    beforeEach(() => {
      control = new FormControl();
      spectator = createHost(
        `<ix-filter-select-list
          [formControl]="control"
          [options]="options()"
          [label]="label"
        ></ix-filter-select-list>`,
        {
          hostProps: {
            control,
            options,
            label: undefined,
          },
        },
      );
      spectator.detectComponentChanges();
    });

    it('renders a label', () => {
      spectator.setHostInput('label', 'Filter Label');

      const label = spectator.query('.label');
      expect(label).toExist();
      expect(label.textContent).toBe('Filter Label');
    });

    it('shows a list of options', () => {
      const items = spectator.queryAll('.item');
      expect(items).toHaveLength(3);
      const labels = items.map((item) => item.textContent.replace(/\s/g, ''));
      expect(labels[0]).toBe('label1');
      expect(labels[1]).toBe('label2');
      expect(labels[2]).toBe('label3');
    });

    it('shows value provided in form control', () => {
      control.setValue('value1');
      spectator.detectComponentChanges();

      let icons = spectator.queryAll('ix-icon');
      expect(icons).toHaveLength(1);
      expect(icons[0].parentNode).toHaveText('label1');

      control.setValue('value2');
      spectator.detectComponentChanges();
      icons = spectator.queryAll('ix-icon');
      expect(icons).toHaveLength(1);
      expect(icons[0].parentNode).toHaveText('label2');
    });

    it('shows value when option is clicked', () => {
      const items: HTMLDivElement[] = spectator.queryAll('.item');

      items[0].click();
      spectator.detectComponentChanges();
      expect(items[0]).toHaveDescendant('ix-icon[name="check_circle"]');

      items[2].click();
      spectator.detectComponentChanges();
      expect(items[2]).toHaveDescendant('ix-icon[name="check_circle"]');
    });
  });

  describe('ix-filter-select-list when multiple is true', () => {
    beforeEach(() => {
      control = new FormControl([]);
      spectator = createHost(
        '<ix-filter-select-list [formControl]="control" [options]="options()" [multiple]="isMultiple"></ix-filter-select-list>',
        { hostProps: { control, options, isMultiple: true } },
      );
      spectator.fixture.detectChanges();
    });

    it('shows value provided in form control', () => {
      control.setValue(['value1']);
      spectator.detectComponentChanges();

      let icons = spectator.queryAll('ix-icon');
      expect(icons).toHaveLength(1);
      expect(icons[0].parentNode).toHaveText('label1');

      control.setValue(['value1', 'value2']);
      spectator.detectComponentChanges();

      icons = spectator.queryAll('ix-icon');
      expect(icons).toHaveLength(2);
      expect(icons[0].parentNode).toHaveText('label1');
      expect(icons[1].parentNode).toHaveText('label2');
    });

    it('shows value when option is clicked', () => {
      const items: HTMLDivElement[] = spectator.queryAll('.item');

      items[0].click();
      spectator.detectComponentChanges();
      expect(items[0]).toHaveDescendant('ix-icon[name="check_circle"]');

      items[2].click();
      spectator.detectComponentChanges();
      expect(items[2]).toHaveDescendant('ix-icon[name="check_circle"]');
    });
  });
});

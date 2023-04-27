import { ReactiveFormsModule } from '@angular/forms';
import { FormControl } from '@ngneat/reactive-forms';
import { createHostFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { Observable, of } from 'rxjs';
import { Option } from 'app/interfaces/option.interface';
import { IxErrorsComponent } from 'app/modules/ix-forms/components/ix-errors/ix-errors.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { FilterSelectListComponent } from 'app/pages/apps/modules/custom-forms/components/filter-select-list/filter-select-list.component';

describe('FilterSelectListComponent', () => {
  let spectator: Spectator<FilterSelectListComponent>;
  let control: FormControl<string | string[]>;
  const options$: Observable<Option[]> = of([
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
    ],
  });

  describe('ix-filter-select-list when multiple is false', () => {
    beforeEach(() => {
      control = new FormControl();
      spectator = createHost(
        '<ix-filter-select-list [formControl]="control" [options]="options$"></ix-filter-select-list>',
        { hostProps: { control, options$ } },
      );
      spectator.fixture.detectChanges();
    });

    it('renders a label', () => {
      spectator.setInput('label', 'Filter Label');

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
      const icons = spectator.queryAll(IxIconComponent);
      expect(icons).toHaveLength(3);

      control.setValue('value1');
      spectator.detectComponentChanges();
      expect(icons[0].name).toBe('check_circle');
      expect(icons[1].name).not.toBe('check_circle');
      expect(icons[2].name).not.toBe('check_circle');

      control.setValue('value2');
      spectator.detectComponentChanges();
      expect(icons[0].name).not.toBe('check_circle');
      expect(icons[1].name).toBe('check_circle');
      expect(icons[2].name).not.toBe('check_circle');
    });

    it('shows value when option is clicked', () => {
      const items: HTMLDivElement[] = spectator.queryAll('.item');
      const icons = spectator.queryAll(IxIconComponent);
      expect(icons).toHaveLength(3);

      items[0].click();
      spectator.detectComponentChanges();
      expect(icons[0].name).toBe('check_circle');
      expect(icons[1].name).not.toBe('check_circle');
      expect(icons[2].name).not.toBe('check_circle');

      items[2].click();
      spectator.detectComponentChanges();
      expect(icons[0].name).not.toBe('check_circle');
      expect(icons[1].name).not.toBe('check_circle');
      expect(icons[2].name).toBe('check_circle');
    });
  });

  describe('ix-filter-select-list when multiple is true', () => {
    beforeEach(() => {
      control = new FormControl([]);
      spectator = createHost(
        '<ix-filter-select-list [formControl]="control" [options]="options$" [multiple]="isMultiple"></ix-filter-select-list>',
        { hostProps: { control, options$, isMultiple: true } },
      );
      spectator.fixture.detectChanges();
    });

    it('shows value provided in form control', () => {
      const icons = spectator.queryAll(IxIconComponent);
      expect(icons).toHaveLength(3);

      control.setValue(['value1']);
      spectator.detectComponentChanges();
      expect(icons[0].name).toBe('check_circle');
      expect(icons[1].name).not.toBe('check_circle');
      expect(icons[2].name).not.toBe('check_circle');

      control.setValue(['value1', 'value2']);
      spectator.detectComponentChanges();
      expect(icons[0].name).toBe('check_circle');
      expect(icons[1].name).toBe('check_circle');
      expect(icons[2].name).not.toBe('check_circle');
    });

    it('shows value when option is clicked', () => {
      const items: HTMLDivElement[] = spectator.queryAll('.item');
      const icons = spectator.queryAll(IxIconComponent);
      expect(icons).toHaveLength(3);

      items[0].click();
      spectator.detectComponentChanges();
      expect(icons[0].name).toBe('check_circle');
      expect(icons[1].name).not.toBe('check_circle');
      expect(icons[2].name).not.toBe('check_circle');

      items[2].click();
      spectator.detectComponentChanges();
      expect(icons[0].name).toBe('check_circle');
      expect(icons[1].name).not.toBe('check_circle');
      expect(icons[2].name).toBe('check_circle');
    });
  });
});

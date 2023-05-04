import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import {
  ChangeDetectorRef, Component, Input, OnInit,
} from '@angular/core';
import { NgControl } from '@angular/forms';
import { ControlValueAccessor } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { Option } from 'app/interfaces/option.interface';

@UntilDestroy()
@Component({
  selector: 'ix-ordered-listbox',
  styleUrls: ['./ordered-list.component.scss'],
  templateUrl: 'ordered-list.component.html',
})
export class OrderedListboxComponent implements ControlValueAccessor, OnInit {
  @Input() label: string;
  @Input() tooltip: string;
  @Input() required: boolean;

  @Input() options: Observable<Option[]>;
  @Input() minHeight = '100px';
  @Input() maxHeight = '300px';

  items: Option[];

  isDisabled = false;
  value: (string | number)[];

  get orderedValue(): (string | number)[] {
    return this.items.filter((item) => this.value.includes(item.value)).map(((item) => item.value));
  }

  constructor(
    public controlDirective: NgControl,
    private cdr: ChangeDetectorRef,
  ) {
    this.controlDirective.valueAccessor = this;
  }

  onChange: (value: (string | number)[]) => void = (): void => {};
  onTouch: () => void = (): void => {};

  writeValue(value: (string | number)[]): void {
    this.value = value;
    this.cdr.markForCheck();
  }

  registerOnChange(onChange: (value: (string | number)[]) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouch = onTouched;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.cdr.markForCheck();
  }

  isChecked(value: string | number): boolean {
    return this.value.includes(value);
  }

  onCheckboxChanged(value: string | number): void {
    if (this.isChecked(value)) {
      this.value = this.value.filter((item) => item !== value);
    } else {
      this.value = [...this.value, value];
    }

    this.onChange(this.orderedValue);
  }

  ngOnInit(): void {
    this.options.pipe(untilDestroyed(this)).subscribe((options) => {
      this.items = options;
      this.orderOptions();
      this.cdr.markForCheck();
    });
  }

  drop(event: CdkDragDrop<string[]>): void {
    moveItemInArray(this.items, event.previousIndex, event.currentIndex);
    this.onChange(this.orderedValue);
  }

  orderOptions(): void {
    this.value.reverse().forEach((value) => {
      const idx = this.items.findIndex((option) => option.value === value);
      this.items.unshift(...this.items.splice(idx, 1));
    });
  }
}

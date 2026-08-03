import {
  CdkDragDrop, moveItemInArray, CdkDropList, CdkDrag,
} from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, input, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgControl } from '@angular/forms';
import { ControlValueAccessor } from '@ngneat/reactive-forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnIconComponent,
  TnListComponent,
  TnListIconDirective,
  TnListItemComponent,
  TnSlideToggleComponent,
} from '@truenas/ui-components';
import { Observable } from 'rxjs';
import { BaseOptionValueType, Option } from 'app/interfaces/option.interface';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
import { normalizeTestIdParts } from 'app/modules/test-id/normalize-test-id.utils';
import { TranslatedString } from 'app/modules/translate/translate.helper';

interface OrderedOption extends Option {
  /**
   * Options here are interface names (`eth0`, `bond0`), which the library would
   * leave as-is where `[ixTest]` produced `eth-0`. Normalizing once, when the
   * options arrive, keeps `toggle-lag-ports-eth-0` intact without rebuilding the
   * array on every change detection pass. The `toggle` prefix comes from
   * `tn-slide-toggle`. See {@link normalizeTestIdParts}.
   */
  testId: string[];
}

@Component({
  selector: 'ix-ordered-listbox',
  styleUrls: ['./ordered-list.component.scss'],
  templateUrl: 'ordered-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxLabelComponent,
    CdkDropList,
    CdkDrag,
    TnListComponent,
    TnListIconDirective,
    TnListItemComponent,
    TnSlideToggleComponent,
    TnIconComponent,
    IxErrorsComponent,
    TranslateModule,
  ],
})
export class OrderedListboxComponent implements ControlValueAccessor, OnInit {
  controlDirective = inject(NgControl);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  readonly label = input<TranslatedString>();
  readonly tooltip = input<TranslatedString>();
  readonly required = input(false);

  readonly options = input.required<Observable<Option[]>>();
  readonly minHeight = input('100px');
  readonly maxHeight = input('300px');

  protected items: OrderedOption[] = [];
  /**
   * The options as they arrived, never reordered. `orderOptions` starts from this rather
   * than from the current row order, so writing a value is idempotent: writing `null`
   * (or a value that selects nothing) restores the source order instead of leaving the
   * rows hoisted by whatever the previous value was.
   */
  private sourceItems: OrderedOption[] = [];

  protected isDisabled = false;
  /** Kept non-null so the template's `isChecked` and `orderOptions` never have to guard. */
  protected value: BaseOptionValueType[] = [];

  private get orderedValue(): BaseOptionValueType[] {
    return this.items.filter((item) => this.value.includes(item.value)).map((item) => item.value);
  }

  constructor() {
    this.controlDirective.valueAccessor = this;
  }

  onChange: (value: BaseOptionValueType[]) => void = (): void => {};
  onTouch: () => void = (): void => {};

  writeValue(value: BaseOptionValueType[]): void {
    this.value = value ?? [];
    // The options usually arrive after the first `writeValue` and are ordered against the
    // stored value in `ngOnInit`. A value written *after* they arrive (a `patchValue` from a
    // late-resolving request) has to reorder the rows itself, or the toggles would flip while
    // the rows stayed in the order the options came in.
    if (this.sourceItems.length) {
      this.orderOptions();
    }
    this.cdr.markForCheck();
  }

  registerOnChange(onChange: (value: BaseOptionValueType[]) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouch = onTouched;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.cdr.markForCheck();
  }

  protected isChecked(value: BaseOptionValueType): boolean {
    return this.value.includes(value);
  }

  protected onCheckboxChanged(value: BaseOptionValueType): void {
    if (this.isChecked(value)) {
      this.value = this.value.filter((item) => item !== value);
    } else {
      this.value = [...this.value, value];
    }

    this.onChange(this.orderedValue);
  }

  ngOnInit(): void {
    this.options().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((options) => {
      this.sourceItems = options.map((option) => ({
        ...option,
        testId: normalizeTestIdParts([this.controlDirective.name, option.label]),
      }));
      this.orderOptions();
      this.cdr.markForCheck();
    });
  }

  protected drop(event: CdkDragDrop<string[]>): void {
    moveItemInArray(this.items, event.previousIndex, event.currentIndex);
    this.onChange(this.orderedValue);
  }

  private orderOptions(): void {
    this.items = [...this.sourceItems];

    this.value.toReversed().forEach((value) => {
      const idx = this.items.findIndex((option) => option.value === value);
      // A stored value can name an option that is no longer offered (an interface taken
      // by another LAG, renamed or removed). Without this guard `splice(-1, 1)` would
      // hoist the last, unrelated option to the top.
      if (idx === -1) {
        return;
      }

      this.items.unshift(...this.items.splice(idx, 1));
    });
  }
}

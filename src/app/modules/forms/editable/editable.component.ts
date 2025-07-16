import { CdkObserveContent } from '@angular/cdk/observers';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component, computed, contentChildren,
  ElementRef,
  input, OnDestroy, OnInit, output,
  signal, viewChild,
} from '@angular/core';
import { AbstractControl, NgControl } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { focusableElements } from 'app/directives/autofocus/focusable-elements.const';
import { EditableService } from 'app/modules/forms/editable/services/editable.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

/**
 * Editable component that allows inline editing of a value.
 *
 * You may want to use it with ix-details-table.
 *
 * @example
 * ```html
 * <ix-editable>
 *    <div view>
 *      {{ form.value.name }}
 *    </div>
 *
 *    <div edit>
 *      <ix-textarea formControlName="name"></ix-textarea>
 *    </div>
 *  </ix-editable>
 * ```
 */
@Component({
  selector: 'ix-editable',
  templateUrl: './editable.component.html',
  styleUrls: ['./editable.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxIconComponent,
    TestDirective,
    TranslateModule,
    CdkObserveContent,
  ],
})
export class EditableComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly emptyValue = input(this.translate.instant('Not Set'));

  /**
   * Disabled prevents editable from being opened, but still communicated to the user that it can be.
   */
  readonly disabled = input(false);

  /**
   * Readonly just shows value as text.
   */
  readonly readonly = input(false);

  readonly closed = output();

  isOpen = signal(false);

  private triggerValue = viewChild<ElementRef<HTMLElement>>('triggerValue');
  private ngControls = contentChildren(NgControl, { descendants: true });
  private controls = computed(() => this.ngControls().map((control) => control.control));

  constructor(
    private translate: TranslateService,
    private elementRef: ElementRef<HTMLElement>,
    private editableService: EditableService,
  ) {}

  protected valueAsText = signal('');

  protected isEmpty = computed(() => {
    return !this.valueAsText();
  });

  protected checkVisibleValue(): void {
    const newValue = this.triggerValue()?.nativeElement?.textContent?.trim();
    this.valueAsText.set(newValue);
  }

  protected ariaLabel = computed(() => {
    return this.translate.instant('Current value is {value}. Click to edit.', {
      value: this.valueAsText(),
    });
  });

  ngOnInit(): void {
    this.editableService.register(this);
  }

  ngAfterViewInit(): void {
    this.checkVisibleValue();
  }

  ngOnDestroy(): void {
    this.editableService.deregister(this);
  }

  isElementWithin(target: HTMLElement): boolean {
    const allowedOverlaySelectors = [
      '.mat-mdc-autocomplete-panel',
      '.mat-mdc-select-panel',
      '.cdk-global-overlay-wrapper',
      '.cdk-overlay-backdrop',
    ];

    if (allowedOverlaySelectors.some((selector) => target.closest(selector))) {
      return true;
    }

    return this.elementRef.nativeElement.contains(target);
  }

  open(): void {
    this.editableService.tryToCloseAll();
    this.isOpen.set(true);

    setTimeout(() => {
      // Find next focusable element and focus it
      this.elementRef.nativeElement.querySelector<HTMLElement>(focusableElements)?.focus();
    });
  }

  hasControl(control: AbstractControl): boolean {
    return this.controls().includes(control);
  }

  tryToClose(): void {
    // Prevent editable from getting closed if there are validation errors.
    if (!this.isOpen() || !this.canClose()) {
      return;
    }

    this.isOpen.set(false);
    this.closed.emit();

    setTimeout(() => {
      this.checkVisibleValue();
    });
  }

  private canClose(): boolean {
    return this.controls().every((control) => control?.errors === null || Object.keys(control?.errors)?.length === 0);
  }
}

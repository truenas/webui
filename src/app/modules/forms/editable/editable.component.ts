import { CdkObserveContent } from '@angular/cdk/observers';
import { DOCUMENT } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, computed, contentChildren, ElementRef, input, OnDestroy, OnInit, output, signal, viewChild, inject } from '@angular/core';
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
  private translate = inject(TranslateService);
  private elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private editableService = inject(EditableService);
  private document = inject(DOCUMENT);

  private clickOutsideListener?: (event: Event) => void;

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
    this.removeClickOutsideListener();
  }

  /**
   * Determines whether the given target element should be considered "inside"
   * this editable component. This prevents the editable from being closed when:
   *
   * - The click occurs within the editable itself.
   * - The click occurs within allowed overlay components like autocomplete, select dropdowns, menus, or datepickers.
   * - Any modal/dialog container is currently open (assumes it overlaps the editable contextually).
   *
   * @param target - The DOM element that was clicked or interacted with.
   * @returns True if the target is within the editable or a valid overlay area; otherwise, false.
  */
  isElementWithin(target: HTMLElement): boolean {
    const editableEl = this.elementRef.nativeElement;

    if (editableEl.contains(target)) return true;

    const allowedOverlaySelectors = [
      '.mat-mdc-autocomplete-panel',
      '.mat-mdc-select-panel',
      '.mat-mdc-menu-panel',
      '.mat-datepicker-content',
    ];

    if (
      allowedOverlaySelectors.some((sel) => document.querySelector(sel)?.contains(target))
      || document.querySelector('.mat-mdc-dialog-container')
    ) {
      return true;
    }

    return false;
  }

  open(): void {
    this.editableService.tryToCloseAll();
    this.isOpen.set(true);
    this.addClickOutsideListener();

    setTimeout(() => {
      this.elementRef.nativeElement.querySelector<HTMLElement>(focusableElements)?.focus();
      const editSlot = this.elementRef.nativeElement.querySelector('.edit-slot') as HTMLElement;
      if (editSlot) {
        editSlot.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
        });
      }
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
    this.removeClickOutsideListener();

    setTimeout(() => {
      this.checkVisibleValue();
    });
  }

  private canClose(): boolean {
    return this.controls().every((control) => control?.errors === null || Object.keys(control?.errors)?.length === 0);
  }

  private addClickOutsideListener(): void {
    this.removeClickOutsideListener();

    this.clickOutsideListener = (event: Event) => {
      const target = event.target as HTMLElement;
      if (!this.isElementWithin(target)) {
        this.tryToClose();
      }
    };

    setTimeout(() => {
      this.document.addEventListener('click', this.clickOutsideListener, { capture: true });
    });
  }

  private removeClickOutsideListener(): void {
    if (this.clickOutsideListener) {
      this.document.removeEventListener('click', this.clickOutsideListener, { capture: true });
      this.clickOutsideListener = undefined;
    }
  }
}

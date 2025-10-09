import { CdkObserveContent } from '@angular/cdk/observers';
import { DOCUMENT } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, computed, contentChildren, ElementRef, input, OnDestroy, output, signal, viewChild, inject, afterNextRender, Injector } from '@angular/core';
import { AbstractControl, NgControl } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { combineLatest, fromEvent, Subject, Subscription, timer } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, startWith, takeUntil } from 'rxjs/operators';
import { ValidationErrorCommunicationService } from 'app/modules/forms/validation-error-communication.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { FocusService } from 'app/services/focus.service';

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
export class EditableComponent implements AfterViewInit, OnDestroy {
  private translate = inject(TranslateService);
  private elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private document = inject(DOCUMENT);
  private injector = inject(Injector);
  private validationErrorService = inject(ValidationErrorCommunicationService);
  private focusService = inject(FocusService);
  private destroy$ = new Subject<void>();
  private clickOutsideSubscription?: Subscription;
  private keydownSubscription?: Subscription;


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

  ngAfterViewInit(): void {
    this.checkVisibleValue();
    this.setupValidationErrorListener();
    this.setupReactiveErrorWatcher();
  }


  ngOnDestroy(): void {
    this.removeClickOutsideListener();
    this.removeKeydownListener();
    this.destroy$.next();
    this.destroy$.complete();
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

    try {
      if (
        allowedOverlaySelectors.some((sel) => document.querySelector(sel)?.contains(target))
        || document.querySelector('.mat-mdc-dialog-container')
      ) {
        return true;
      }
    } catch (error) {
      console.warn('Error checking overlay selectors:', error);
      return false;
    }

    return false;
  }

  open(): void {
    this.focusService.captureCurrentFocus();
    this.isOpen.set(true);
    this.addClickOutsideListener();
    this.addKeydownListener();

    afterNextRender(() => {
      this.focusService.focusFirstFocusableElement(this.elementRef.nativeElement);
      const editSlot = this.elementRef.nativeElement.querySelector<HTMLElement>('.edit-slot');
      if (editSlot) {
        editSlot.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }, { injector: this.injector });
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
    this.removeKeydownListener();

    this.focusService.restoreFocus();

    setTimeout(() => {
      this.checkVisibleValue();
    });
  }

  private canClose(): boolean {
    return this.controls().every((control) => !control?.errors || Object.keys(control.errors).length === 0);
  }

  private addClickOutsideListener(): void {
    // Remove existing listener to prevent duplicates
    this.removeClickOutsideListener();

    this.clickOutsideSubscription = fromEvent(this.document, 'click', { capture: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe((event: Event) => {
        const target = event.target as HTMLElement;
        if (!this.isElementWithin(target)) {
          this.tryToClose();
        }
      });
  }

  private addKeydownListener(): void {
    this.removeKeydownListener();

    this.keydownSubscription = fromEvent(this.document, 'keydown', { capture: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe((event: KeyboardEvent) => {
        this.handleKeydown(event);
      });
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      const globalSearchOverlay = this.document.querySelector('.topbar-panel');
      if (globalSearchOverlay) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      this.tryToClose();
    }
  }

  private removeClickOutsideListener(): void {
    if (this.clickOutsideSubscription) {
      this.clickOutsideSubscription.unsubscribe();
      this.clickOutsideSubscription = undefined;
    }
  }

  private removeKeydownListener(): void {
    this.keydownSubscription?.unsubscribe();
    this.keydownSubscription = undefined;
  }

  private setupValidationErrorListener(): void {
    this.validationErrorService.validationErrors$
      .pipe(
        filter((errorEvent) => this.isFieldRelevantToThisEditable(errorEvent.fieldName)),
        takeUntil(this.destroy$),
      )
      .subscribe((errorEvent) => {
        this.handleValidationErrorEvent(errorEvent);
      });
  }

  private isFieldRelevantToThisEditable(fieldName: string): boolean {
    if (!fieldName) {
      return false;
    }

    const controls = this.controls();

    // If no controls, this editable doesn't handle any fields
    if (controls.length === 0) {
      return false;
    }

    // Check if any of our form controls match the field name
    let hasMatchingControl = false;
    let hasStructuredParent = false;

    for (const control of controls) {
      if (!control) {
        continue;
      }

      // Try to get control name from form group
      const parent = control.parent;
      if (parent && 'controls' in parent) {
        hasStructuredParent = true;
        const parentControls = parent.controls as Record<string, AbstractControl>;
        const controlName = Object.keys(parentControls).find((key) => parentControls[key] === control);
        if (controlName === fieldName) {
          hasMatchingControl = true;
          break;
        }
      }
    }

    // If we found a matching control name, use it
    if (hasMatchingControl) {
      return true;
    }

    // If no controls have structured parents (like in tests),
    // be permissive but only for this editable's controls
    if (!hasStructuredParent && controls.length > 0) {
      return true;
    }

    return false;
  }

  private handleValidationErrorEvent(errorEvent: { fieldName: string }): void {
    const { fieldName } = errorEvent;
    if (!fieldName) {
      return;
    }

    // Use RxJS timer instead of setTimeout to handle validation error propagation
    // This provides better testability and cancellation support
    timer(50).pipe(
      takeUntil(this.destroy$),
    ).subscribe(() => {
      const hasErrors = this.controls().some((control) => control?.errors && Object.keys(control.errors).length > 0);

      if (hasErrors && !this.isOpen()) {
        this.open();
      }
    });
  }


  private setupReactiveErrorWatcher(): void {
    afterNextRender(() => {
      const controls = this.controls();
      if (controls.length === 0) {
        return;
      }

      // Watch for status changes on all controls
      const statusChanges$ = combineLatest(
        controls.map((control) => control.statusChanges.pipe(startWith(control.status))),
      );

      statusChanges$
        .pipe(
          distinctUntilChanged(),
          debounceTime(0),
          filter(() => !this.isOpen()),
          takeUntil(this.destroy$),
        )
        .subscribe(() => {
          const hasErrors = this.controls().some(
            (control) => control?.errors && Object.keys(control.errors).length > 0,
          );
          // Only auto-open if errors are present and this isn't initial form setup
          if (hasErrors && this.shouldAutoOpenForErrors()) {
            this.open();
          }
        });
    }, { injector: this.injector });
  }

  private shouldAutoOpenForErrors(): boolean {
    // Auto-open if any control has been touched (user interaction)
    if (this.controls().some((control) => control?.touched)) {
      return true;
    }

    // For untouched controls, only auto-open if they have both errors AND dirty state
    // Dirty indicates the value was programmatically set (like saved invalid data)
    // but not touched by user, which distinguishes it from initial empty state
    return this.controls().some((control) => {
      return control?.dirty
        && control?.errors
        && Object.keys(control.errors).length > 0;
    });
  }
}

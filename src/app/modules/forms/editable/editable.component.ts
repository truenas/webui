import { CdkObserveContent } from '@angular/cdk/observers';
import { DOCUMENT } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, computed, contentChildren, ElementRef, input, OnDestroy, output, signal, viewChild, inject, afterNextRender, Injector } from '@angular/core';
import { AbstractControl, NgControl } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { fromEvent, Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { focusableElements } from 'app/directives/autofocus/focusable-elements.const';
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
export class EditableComponent implements AfterViewInit, OnDestroy {
  private translate = inject(TranslateService);
  private elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private document = inject(DOCUMENT);
  private injector = inject(Injector);
  private destroy$ = new Subject<void>();
  private clickOutsideSubscription?: Subscription;
  private keydownSubscription?: Subscription;
  private previouslyFocusedElement?: HTMLElement;


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
    // Store the currently focused element for restoration later
    this.previouslyFocusedElement = this.document.activeElement as HTMLElement;
    this.isOpen.set(true);
    this.addClickOutsideListener();
    this.addKeydownListener();

    afterNextRender(() => {
      this.elementRef.nativeElement.querySelector<HTMLElement>(focusableElements)?.focus();
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

    // Restore focus to the previously focused element
    if (this.previouslyFocusedElement) {
      try {
        if (this.document.contains(this.previouslyFocusedElement)
          && this.previouslyFocusedElement.isConnected) {
          this.previouslyFocusedElement.focus();
        }
      } catch (error) {
        console.warn('Failed to restore focus:', error);
      }
    }
    this.previouslyFocusedElement = undefined;

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
}

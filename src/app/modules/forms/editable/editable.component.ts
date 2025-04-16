import {
  ChangeDetectionStrategy,
  Component, computed,
  ElementRef, HostListener,
  input, OnDestroy, OnInit, output,
  signal, viewChild,
} from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { TranslateService } from '@ngx-translate/core';
import { focusableElements } from 'app/directives/autofocus/focusable-elements.const';
import { EditableService } from 'app/modules/forms/editable/services/editable.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-editable',
  templateUrl: './editable.component.html',
  styleUrls: ['./editable.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxIconComponent,
    MatIconButton,
    TestDirective,
  ],
})
export class EditableComponent implements OnInit, OnDestroy {
  readonly emptyValue = input(this.translate.instant('Not Set'));
  readonly controls = input<AbstractControl[]>([]);

  readonly closed = output();

  isOpen = signal(false);

  private triggerValue = viewChild<ElementRef<HTMLElement>>('triggerValue');

  private oldValues = new Map<AbstractControl, unknown>([]);

  constructor(
    private translate: TranslateService,
    private elementRef: ElementRef<HTMLElement>,
    private editableService: EditableService,
  ) {}

  protected isEmpty = computed(() => {
    return !this.valueAsText();
  });

  protected valueAsText = computed(() => {
    return this.triggerValue()?.nativeElement?.textContent?.trim();
  });

  ngOnInit(): void {
    this.editableService.register(this);
  }

  ngOnDestroy(): void {
    this.editableService.deregister(this);
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const isInsideClick = this.elementRef.nativeElement.contains(event.target as HTMLElement);
    if (isInsideClick || !this.isOpen()) {
      return;
    }

    // TODO: Do something better?
    setTimeout(() => {
      this.toggleMode();
    }, 100);
  }

  // Close on Escape
  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isOpen()) {
      this.tryToClose();
    }
  }

  protected onClick(): void {
    this.toggleMode();
  }

  toggleMode(): void {
    if (this.isOpen()) {
      this.tryToClose();
    } else {
      this.open();
    }
  }

  open(): void {
    this.isOpen.set(true);

    this.rememberControlValues();

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
    if (!this.canClose()) {
      return;
    }

    this.isOpen.set(false);
    this.closed.emit();
  }

  cancel(): void {
    this.controls().forEach((control) => {
      const oldValue = this.oldValues.get(control);
      control.setValue(oldValue);
    });

    this.tryToClose();
  }

  save(): void {
    console.error('not implemented');
  }

  private rememberControlValues(): void {
    this.oldValues.clear();

    this.controls().forEach((control) => {
      this.oldValues.set(control, control.value);
    });
  }

  private canClose(): boolean {
    return this.controls().every((control) => control.valid);
  }
}

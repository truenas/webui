import {
  Directive, ElementRef, HostListener, Input,
} from '@angular/core';
import { MAT_INPUT_VALUE_ACCESSOR } from '@angular/material/input';

@Directive({
  selector: 'input[matInputMasked]',
  providers: [
    { provide: MAT_INPUT_VALUE_ACCESSOR, useExisting: MatInputMaskedDirective },
  ],
})
export class MatInputMaskedDirective {
  private originalValue: string | null;
  @Input() matInputMasked: boolean;
  @Input() formatValue: (value: string) => string;
  @Input() unformatValue: (value: string) => string;

  constructor(private elementRef: ElementRef<HTMLInputElement>) {}

  get value(): string | null {
    return this.originalValue;
  }

  @Input()
  set value(value: string | null) {
    this.originalValue = value;
  }

  @HostListener('input', ['$event.target.value'])
  input(value: string): void {
    if (this.matInputMasked) {
      this.handleUnformatValue(value);
    }
  }

  @HostListener('blur')
  blur(): void {
    if (this.matInputMasked) {
      this.handleFormatValue(this.originalValue);
    }
  }

  @HostListener('focus')
  focus(): void {
    if (this.matInputMasked) {
      this.handleUnformatValue();
    }
  }

  private handleFormatValue(value: string | null): void {
    if (value !== null && this.formatValue) {
      this.elementRef.nativeElement.value = this.formatValue(value);
    }
  }

  private handleUnformatValue(value: string = this.elementRef.nativeElement.value): void {
    if (value && this.unformatValue) {
      this.originalValue = this.unformatValue(value);
      this.elementRef.nativeElement.value = this.originalValue;
    }
  }
}

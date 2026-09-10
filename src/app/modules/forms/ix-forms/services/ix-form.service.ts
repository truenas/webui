import { ElementRef, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class IxFormService {
  private readonly controls = new Map<string, HTMLElement>();

  getControlNames(): (string | number | null)[] {
    return [...this.controls.keys()];
  }

  getElementByControlName(name: string): HTMLElement | undefined {
    return this.controls.get(name) || undefined;
  }

  registerControl(
    name: string,
    elementRef: ElementRef<HTMLElement>,
  ): void {
    this.controls.set(name, elementRef.nativeElement);
  }

  unregisterControl(name: string): void {
    this.controls.delete(name);
  }
}

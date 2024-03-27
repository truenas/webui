import { ElementRef, Injectable } from '@angular/core';
import { NgControl } from '@angular/forms';

@Injectable({ providedIn: 'root' })
export class IxFormService {
  private controls = new Map<NgControl, HTMLElement>();

  getControls(): NgControl[] {
    return [...this.controls.keys()];
  }

  getControlsNames(): (string | number | null)[] {
    return this.getControls().map((ctrl) => ctrl.name);
  }

  getControlByName(controlName: string): NgControl | undefined {
    return this.getControls().find((control) => control.name === controlName);
  }

  getElementByControlName(controlName: string): HTMLElement | undefined {
    const control = this.getControlByName(controlName);
    return control ? this.controls.get(control) : undefined;
  }

  registerControl(control: NgControl, elementRef: ElementRef<HTMLElement>): void {
    this.controls.set(control, elementRef.nativeElement);
  }

  unregisterControl(control: NgControl): void {
    this.controls.delete(control);
  }
}

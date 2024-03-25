import { Injectable } from '@angular/core';
import { NgControl } from '@angular/forms';

@Injectable({ providedIn: 'root' })
export class IxFormService {
  private controls = new Set<NgControl>();

  getControls(): NgControl[] {
    return [...this.controls];
  }

  registerControl(control: NgControl): void {
    this.controls.add(control);
  }

  unregisterControl(control: NgControl): void {
    this.controls.delete(control);
  }
}

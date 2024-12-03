import { ElementRef, Injectable, signal } from '@angular/core';
import { NgControl } from '@angular/forms';
import { Option } from 'app/interfaces/option.interface';
import { ixControlLabelTag } from 'app/modules/forms/ix-forms/directives/registered-control.directive';

@Injectable({ providedIn: 'root' })
export class IxFormService {
  private controls = new Map<NgControl, HTMLElement>();
  controlsOptions = signal<Option[]>([]);
  private elementsWithIds = new Map<string, HTMLElement>();

  getControls(): NgControl[] {
    return [...this.controls.keys()];
  }

  getControlsNames(): (string | number | null)[] {
    return this.getControls().map((ctrl) => ctrl.name);
  }

  private getControlsOptions(query = ''): Option[] {
    const options: Option[] = [];
    const cleanedQuery = query.toLowerCase().trim();
    for (const [control, element] of this.controls.entries()) {
      const name = control.name?.toString();
      if (!name) {
        continue;
      }
      const label = element.getAttribute(ixControlLabelTag)?.toString() || name;
      if (!query) {
        options.push({ label, value: name });
      } else {
        const cleanedLabel = label.trim().toLowerCase();
        const cleanedName = name.trim().toLowerCase();
        if (cleanedName.includes(cleanedQuery) || cleanedLabel.includes(cleanedQuery)) {
          options.push({ label, value: name });
        }
      }
    }

    for (const [id, element] of this.elementsWithIds.entries()) {
      const name = id;
      if (!name) {
        continue;
      }
      const label = element.getAttribute(ixControlLabelTag)?.toString() || name;
      if (!query) {
        options.push({ label, value: name });
      } else {
        const cleanedLabel = label.trim().toLowerCase();
        const cleanedName = name.trim().toLowerCase();
        if (cleanedName.includes(cleanedQuery) || cleanedLabel.includes(cleanedQuery)) {
          options.push({ label, value: name });
        }
      }
    }
    return options;
  }

  getControlByName(controlName: string): NgControl | undefined {
    return this.getControls().find((control) => control.name === controlName);
  }

  getElementByControlName(controlName: string): HTMLElement | undefined {
    const control = this.getControlByName(controlName);
    if (control) {
      return this.controls.get(control);
    }
    const element = this.elementsWithIds.get(controlName);

    return element || undefined;
  }

  getElementByLabel(label: string): HTMLElement | undefined {
    for (const htmlElement of this.controls.values()) {
      if (htmlElement.getAttribute(ixControlLabelTag) === label) {
        return htmlElement;
      }
    }
    return undefined;
  }

  registerControl(control: NgControl, elementRef: ElementRef<HTMLElement>): void {
    this.controls.set(control, elementRef.nativeElement);
    this.controlsOptions.set(this.getControlsOptions());
  }

  unregisterControl(control: NgControl): void {
    this.controls.delete(control);
  }

  registerNonControlForSearch(id: string, elementRef: ElementRef<HTMLElement>): void {
    this.elementsWithIds.set(id, elementRef.nativeElement);
    this.controlsOptions.set(this.getControlsOptions());
  }
}

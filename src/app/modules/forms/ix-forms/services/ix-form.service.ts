import { ElementRef, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ControlNameWithLabel } from 'app/interfaces/control-name-with-label.interface';
import { ixControlLabelTag } from 'app/modules/forms/ix-forms/directives/registered-control.directive';

@Injectable({ providedIn: 'root' })
export class IxFormService {
  private controls = new Map<string, HTMLElement>();
  controlNamesWithlabels$ = new BehaviorSubject<ControlNameWithLabel[]>([]);

  getControlsNames(): (string | number | null)[] {
    return [...this.controls.keys()];
  }

  private getControlsLabels(): ControlNameWithLabel[] {
    const options: ControlNameWithLabel[] = [];
    for (const [controlName, element] of this.controls.entries()) {
      const name = controlName?.toString();
      if (!name) {
        continue;
      }
      const label = element.getAttribute(ixControlLabelTag)?.toString() || name;
      options.push({ label, name });
    }

    return options;
  }

  getElementByControlName(name: string): HTMLElement | undefined {
    return this.controls.get(name) || undefined;
  }

  getElementByLabel(label: string): HTMLElement | undefined {
    for (const htmlElement of this.controls.values()) {
      if (htmlElement.getAttribute(ixControlLabelTag) === label) {
        return htmlElement;
      }
    }
    return undefined;
  }

  registerControl(name: string, elementRef: ElementRef<HTMLElement>): void {
    this.controls.set(name, elementRef.nativeElement);
    this.controlNamesWithlabels$.next(this.getControlsLabels());
  }

  unregisterControl(name: string): void {
    this.controls.delete(name);
    this.controlNamesWithlabels$.next(this.getControlsLabels());
  }
}

import { ElementRef, Injectable } from '@angular/core';
import { NgControl } from '@angular/forms';
import { BehaviorSubject, Observable } from 'rxjs';
import { ControlNameWithLabel, SectionWithControls } from 'app/interfaces/form-sections.interface';
import { IxFormSectionComponent } from 'app/modules/forms/ix-forms/components/ix-form-section/ix-form-section.component';
import { ixControlLabelTag } from 'app/modules/forms/ix-forms/directives/registered-control.directive';

@Injectable({ providedIn: 'root' })
export class IxFormService {
  private controls = new Map<string, HTMLElement>();
  private sections = new Map<IxFormSectionComponent, (NgControl | null)[]>();
  private readonly controlNamesWithlabels = new BehaviorSubject<ControlNameWithLabel[]>([]);
  private readonly controlSections = new BehaviorSubject<SectionWithControls[]>([]);

  controlNamesWithLabels$: Observable<ControlNameWithLabel[]> = this.controlNamesWithlabels.asObservable();
  controlSections$: Observable<SectionWithControls[]> = this.controlSections.asObservable();

  getControlNames(): (string | number | null)[] {
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

  registerControl(
    name: string,
    elementRef: ElementRef<HTMLElement>,
  ): void {
    this.controls.set(name, elementRef.nativeElement);
    this.controlNamesWithlabels.next(this.getControlsLabels());
  }

  registerSectionControl(
    control: NgControl | null,
    formSection: IxFormSectionComponent,
  ): void {
    let controls = this.sections.get(formSection);
    if (!controls?.length) {
      controls = [];
    }
    controls.push(control);
    this.sections.set(formSection, controls);
    this.updateSections();
  }

  unregisterControl(name: string): void {
    this.controls.delete(name);
    this.controlNamesWithlabels.next(this.getControlsLabels());
  }

  unregisterSectionControl(section: IxFormSectionComponent, control: NgControl | null): void {
    const namedControls = (this.sections.get(section) || []).filter((ngControl) => ngControl !== control);

    if (namedControls.length) {
      this.sections.set(section, namedControls);
    } else {
      this.sections.delete(section);
    }
    this.updateSections();
  }

  private updateSections(): void {
    const controlSections: SectionWithControls[] = [];
    for (const [section, controls] of this.sections.entries()) {
      controlSections.push({ section, controls });
    }
    this.controlSections.next(controlSections);
  }
}

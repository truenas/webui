import { NgControl } from '@angular/forms';
import { IxFormSectionComponent } from 'app/modules/forms/ix-forms/components/ix-form-section/ix-form-section.component';

export interface ControlNameWithLabel { label: string; name: string }
export interface SectionWithControls {
  section: IxFormSectionComponent;
  controls: (NgControl | null)[] | undefined;
}

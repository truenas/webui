import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  viewChildren,
} from '@angular/core';
import { MatStepper, MatStepperIcon, MatStepperIconContext } from '@angular/material/stepper';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';

/**
 * Sets ixIcons to be used with mat-stepper.
 * Usage: add this component inside a mat-stepper component.
 */
@Component({
  selector: 'ix-use-ix-icons-in-stepper',
  standalone: true,
  templateUrl: './use-ix-icons-in-stepper.component.html',
  imports: [
    IxIconComponent,
    MatStepperIcon,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UseIxIconsInStepperComponent implements AfterViewInit {
  readonly stepperIcons = viewChildren(MatStepperIcon);

  constructor(
    private stepper: MatStepper,
  ) {}

  ngAfterViewInit(): void {
    this.stepper._iconOverrides = this.getIconOverrides();
  }

  getIconOverrides(): Record<string, TemplateRef<MatStepperIconContext>> {
    const stepperIcons = this.stepperIcons();
    if (!stepperIcons) {
      return {};
    }

    return stepperIcons.reduce((overrides, icon) => {
      overrides[icon.name] = icon.templateRef;
      return overrides;
    }, {} as Record<string, TemplateRef<MatStepperIconContext>>);
  }
}

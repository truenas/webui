import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  ViewChildren,
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
  @ViewChildren(MatStepperIcon) stepperIcons: MatStepperIcon[];

  constructor(
    private stepper: MatStepper,
  ) {}

  ngAfterViewInit(): void {
    this.stepper._iconOverrides = this.getIconOverrides();
  }

  getIconOverrides(): Record<string, TemplateRef<MatStepperIconContext>> {
    if (!this.stepperIcons) {
      return {};
    }

    return this.stepperIcons.reduce((overrides, icon) => {
      overrides[icon.name] = icon.templateRef;
      return overrides;
    }, {} as Record<string, TemplateRef<MatStepperIconContext>>);
  }
}

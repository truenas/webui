import { AfterViewInit, ChangeDetectionStrategy, Component, TemplateRef, viewChildren, inject } from '@angular/core';
import { MatStepper, MatStepperIcon, MatStepperIconContext } from '@angular/material/stepper';
import { TnIconComponent } from '@truenas/ui-components';

/**
 * Sets TrueNAS icons to be used with mat-stepper.
 * Usage: add this component inside a mat-stepper component.
 */
@Component({
  selector: 'ix-use-ix-icons-in-stepper',
  templateUrl: './use-icons-in-stepper.component.html',
  imports: [
    TnIconComponent,
    MatStepperIcon,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UseIconsInStepperComponent implements AfterViewInit {
  private stepper = inject(MatStepper);

  readonly stepperIcons = viewChildren(MatStepperIcon);

  ngAfterViewInit(): void {
    this.stepper._iconOverrides = this.getIconOverrides();
  }

  private getIconOverrides(): Record<string, TemplateRef<MatStepperIconContext>> {
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

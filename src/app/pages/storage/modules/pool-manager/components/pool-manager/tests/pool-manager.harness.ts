import { ComponentHarness, ComponentHarnessConstructor, parallel } from '@angular/cdk/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatStepHarness, MatStepperHarness } from '@angular/material/stepper/testing';
import {
  fillControlValues,
  getControlValues, getDisabledStates,
  indexControlsByLabel, IxFormBasicValueType, SupportedFormControlHarness,
  supportedFormControlSelectors,
} from 'app/modules/forms/ix-forms/testing/control-harnesses.helpers';
import { ConfigurationPreviewHarness } from 'app/pages/storage/modules/pool-manager/components/configuration-preview/configuration-preview.harness';
import { ExistingConfigurationPreviewHarness } from 'app/pages/storage/modules/pool-manager/components/existing-configuration-preview/existing-configuration-preview.harness';
import { NewDevicesConfigurationPreviewHarness } from 'app/pages/storage/modules/pool-manager/components/new-devices/new-devices-configuration-preview.harness';
import { ReviewWizardStepHarness } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/9-review-wizard-step/review-wizard-step.harness';

export class PoolManagerHarness extends ComponentHarness {
  static readonly hostSelector = 'ix-pool-manager';

  getStepper = this.locatorFor(MatStepperHarness);
  getStartOverButton = this.locatorFor(MatButtonHarness.with({ text: 'Start Over' }));
  getNextButton = this.locatorFor(MatButtonHarness.with({ text: 'Next' }));
  getBackButton = this.locatorFor(MatButtonHarness.with({ text: 'Back' }));
  getCreatePoolButton = this.locatorFor(MatButtonHarness.with({ text: 'Create Pool' }));
  getUpdatePoolButton = this.locatorFor(MatButtonHarness.with({ text: 'Update Pool' }));

  getConfigurationPreview = this.locatorFor(ConfigurationPreviewHarness);
  getExistingConfigurationPreview = this.locatorFor(ExistingConfigurationPreviewHarness);
  getNewDevicesConfigurationPreview = this.locatorFor(NewDevicesConfigurationPreviewHarness);

  getReviewWizardStep = this.locatorFor(ReviewWizardStepHarness);

  async getActiveStep(): Promise<MatStepHarness> {
    const stepper = await this.getStepper();
    const steps = await stepper.getSteps({ selected: true });
    return steps[0];
  }

  // TODO: This is similar to ix-form.harness.ts and ix-fieldset-harness.
  // TODO: Find a way to apply IxFormHarness to portions of components.
  async getControlHarnessesInStep(): Promise<Record<string, SupportedFormControlHarness>> {
    const activeStep = await this.getActiveStep();
    const controlsByTypes = await parallel(() => {
      return supportedFormControlSelectors.map((selector) => {
        return activeStep.getAllHarnesses(selector as ComponentHarnessConstructor<ComponentHarness>);
      });
    });

    const controls = controlsByTypes.flatMap((controlsInType) => controlsInType.flat());
    return indexControlsByLabel(controls as SupportedFormControlHarness[]);
  }

  async getConfigurationPreviewSummary(): Promise<Record<string, string>> {
    return (await this.getConfigurationPreview()).getItems();
  }

  async getExistingConfigurationPreviewSummary(): Promise<Record<string, string>> {
    return (await this.getExistingConfigurationPreview()).getItems();
  }

  async getNewDevicesConfigurationPreviewSummary(): Promise<Record<string, string>> {
    return (await this.getNewDevicesConfigurationPreview()).getItems();
  }

  async clickNext(): Promise<void> {
    await (await this.getNextButton()).click();
  }

  async clickBack(): Promise<void> {
    await (await this.getBackButton()).click();
  }

  async clickCreatePoolButton(): Promise<void> {
    await (await this.getCreatePoolButton()).click();
  }

  async clickUpdatePoolButton(): Promise<void> {
    await (await this.getUpdatePoolButton()).click();
  }

  async clickStartOver(): Promise<void> {
    await (await this.getStartOverButton()).click();
  }

  async fillStep(values: Record<string, unknown>): Promise<void> {
    const controls = await this.getControlHarnessesInStep();
    return fillControlValues(controls, values);
  }

  async getControl(label: string): Promise<SupportedFormControlHarness> {
    const controlsDict = await this.getControlHarnessesInStep();
    return controlsDict[label];
  }

  async getStepValues(): Promise<Record<string, IxFormBasicValueType>> {
    const controlsDict = await this.getControlHarnessesInStep();
    return getControlValues(controlsDict);
  }

  async getStepDisabledStates(): Promise<Record<string, boolean>> {
    const controls = await this.getControlHarnessesInStep();
    return getDisabledStates(controls);
  }
}

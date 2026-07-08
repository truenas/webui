import {
  ComponentHarness, ComponentHarnessConstructor, HarnessQuery, parallel,
} from '@angular/cdk/testing';
import { TnButtonHarness, TnStepperHarness } from '@truenas/ui-components';
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

/**
 * Lightweight stand-in for the old MatStepHarness. tn-stepper renders only the
 * active step's content, so "the active step" is just the pool-manager host with
 * a label resolved from the stepper header.
 */
export interface ActiveStepHarness {
  getLabel(): Promise<string>;
  getHarness<T extends ComponentHarness>(query: HarnessQuery<T>): Promise<T>;
}

export class PoolManagerHarness extends ComponentHarness {
  static readonly hostSelector = 'ix-pool-manager';

  getStepper = this.locatorFor(TnStepperHarness);
  getStartOverButton = this.locatorFor(TnButtonHarness.with({ label: 'Start Over' }));
  getNextButton = this.locatorFor(TnButtonHarness.with({ label: 'Next' }));
  getBackButton = this.locatorFor(TnButtonHarness.with({ label: 'Back' }));
  getCreatePoolButton = this.locatorFor(TnButtonHarness.with({ label: 'Create Pool' }));
  getUpdatePoolButton = this.locatorFor(TnButtonHarness.with({ label: 'Update Pool' }));

  getConfigurationPreview = this.locatorFor(ConfigurationPreviewHarness);
  getExistingConfigurationPreview = this.locatorFor(ExistingConfigurationPreviewHarness);
  getNewDevicesConfigurationPreview = this.locatorFor(NewDevicesConfigurationPreviewHarness);

  getReviewWizardStep = this.locatorFor(ReviewWizardStepHarness);

  async getActiveStep(): Promise<ActiveStepHarness> {
    const stepper = await this.getStepper();
    const index = await stepper.getSelectedIndex();
    const labels = await stepper.getStepLabels();
    return {
      getLabel: () => Promise.resolve(labels[index]),
      getHarness: <T extends ComponentHarness>(query: HarnessQuery<T>) => this.locatorFor(query)(),
    };
  }

  async goToStep(label: string): Promise<void> {
    const stepper = await this.getStepper();
    const labels = await stepper.getStepLabels();
    await stepper.selectStep(labels.indexOf(label));
  }

  // TODO: This is similar to ix-form.harness.ts and ix-fieldset-harness.
  // TODO: Find a way to apply IxFormHarness to portions of components.
  async getControlHarnessesInStep(): Promise<Record<string, SupportedFormControlHarness>> {
    // Only the active step's content is rendered, so querying the host is
    // equivalent to scoping to the active step.
    const controlsByTypes = await parallel(() => {
      return supportedFormControlSelectors.map((selector) => {
        return this.locatorForAll(selector as ComponentHarnessConstructor<ComponentHarness>)();
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

import { enclosureMocks } from 'app/core/testing/mock-enclosure/enclosure-templates/enclosure-mocks';
import { addDisksToMostSlots } from 'app/core/testing/mock-enclosure/enclosure-templates/utils/disk.utils';
import { addPoolsToMostDisks } from 'app/core/testing/mock-enclosure/enclosure-templates/utils/pool.utils';
import { MockStorageScenario } from 'app/core/testing/mock-enclosure/enums/mock-storage.enum';
import { MockEnclosureConfig } from 'app/core/testing/mock-enclosure/interfaces/mock-enclosure.interface';
import { ApiCallResponse } from 'app/interfaces/api/api-call-directory.interface';
import { DashboardEnclosure } from 'app/interfaces/enclosure.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';

export class MockStorageGenerator {
  private enclosures: DashboardEnclosure[];

  constructor(
    private config: MockEnclosureConfig,
  ) {
    this.enclosures = [];
    this.addEnclosure(this.config.controllerModel);
    this.config.expansionModels.forEach((model) => this.addEnclosure(model));
    this.handleMockingScenario(this.config.scenario);
  }

  webuiDashboardEnclosureResponse(): ApiCallResponse<'webui.enclosure.dashboard'> {
    return this.enclosures;
  }

  enhanceSystemInfoResponse(response: SystemInfo): SystemInfo {
    return {
      ...response,
      platform: `TRUENAS-${this.config.controllerModel}`,
      system_product: `TRUENAS-${this.config.controllerModel}`,
      system_manufacturer: 'iXsystems',
      remote_info: response.remote_info
        ? {
          ...response.remote_info,
          platform: `TRUENAS-${this.config.controllerModel}`,
          system_product: `TRUENAS-${this.config.controllerModel}`,
        }
        : null,
    };
  }

  private addEnclosure(model: string): void {
    const enclosure = enclosureMocks.find((mock) => mock.model === model);

    if (!enclosure) {
      throw new Error(`Enclosure model ${model} not found in mock storage generator`);
    }

    this.enclosures.push(enclosure);
  }

  private handleMockingScenario(scenario: MockStorageScenario): void {
    if (scenario === MockStorageScenario.AllSlotsEmpty) {
      return;
    }

    if (scenario === MockStorageScenario.FillSomeSlots) {
      this.enclosures = addDisksToMostSlots(this.enclosures);
      this.enclosures = addPoolsToMostDisks(this.enclosures);
    }
  }
}

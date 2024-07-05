import { unsupportedEnclosureMock } from 'app/constants/server-series.constant';
import { enclosureMocks } from 'app/core/testing/mock-enclosure/enclosure-templates/enclosure-mocks';
import { addDisksToSlots } from 'app/core/testing/mock-enclosure/enclosure-templates/utils/disk.utils';
import {
  addPoolsToDisks,
  randomizeDiskStatuses,
} from 'app/core/testing/mock-enclosure/enclosure-templates/utils/pool.utils';
import { MockStorageScenario } from 'app/core/testing/mock-enclosure/enums/mock-storage.enum';
import { MockEnclosureConfig } from 'app/core/testing/mock-enclosure/interfaces/mock-enclosure.interface';
import { EnclosureModel } from 'app/enums/enclosure-model.enum';
import { assertUnreachable } from 'app/helpers/assert-unreachable.utils';
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

  private addEnclosure(model: EnclosureModel): void {
    const enclosure = enclosureMocks.find((mock) => mock.model === model) || unsupportedEnclosureMock;

    this.enclosures.push(enclosure);
  }

  private handleMockingScenario(scenario: MockStorageScenario): void {
    switch (scenario) {
      case MockStorageScenario.AllSlotsEmpty:
        return;
      case MockStorageScenario.FillSomeSlots:
        this.enclosures = addDisksToSlots(this.enclosures, 0.8);
        this.enclosures = addPoolsToDisks(this.enclosures, 0.8);
        return;
      case MockStorageScenario.FillAllSlots:
        this.enclosures = addDisksToSlots(this.enclosures, 1);
        this.enclosures = addPoolsToDisks(this.enclosures, 1);
        return;
      case MockStorageScenario.DiskStatuses:
        this.enclosures = addDisksToSlots(this.enclosures, 0.8);
        this.enclosures = addPoolsToDisks(this.enclosures, 0.8);
        this.enclosures = randomizeDiskStatuses(this.enclosures);
        return;
      default:
        assertUnreachable(scenario);
    }
  }
}

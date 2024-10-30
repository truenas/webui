import { enclosureMocks } from 'app/core/testing/mock-enclosure/enclosure-templates/enclosure-mocks';
import { addDisksToSlots } from 'app/core/testing/mock-enclosure/enclosure-templates/utils/disk.utils';
import {
  addPoolsToDisks,
  randomizeDiskStatuses,
} from 'app/core/testing/mock-enclosure/enclosure-templates/utils/pool.utils';
import { MockEnclosureScenario } from 'app/core/testing/mock-enclosure/enums/mock-enclosure.enum';
import { MockEnclosureConfig } from 'app/core/testing/mock-enclosure/interfaces/mock-enclosure.interface';
import { EnclosureModel } from 'app/enums/enclosure-model.enum';
import { assertUnreachable } from 'app/helpers/assert-unreachable.utils';
import { ApiCallResponse } from 'app/interfaces/api/api-call-directory.interface';
import { DashboardEnclosure } from 'app/interfaces/enclosure.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';

export class MockEnclosureGenerator {
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
    const enclosure = enclosureMocks.find((mock) => mock.model === model);

    this.enclosures.push(enclosure);
  }

  private handleMockingScenario(scenario: MockEnclosureScenario): void {
    switch (scenario) {
      case MockEnclosureScenario.AllSlotsEmpty:
        return;
      case MockEnclosureScenario.FillSomeSlots:
        this.enclosures = addDisksToSlots(this.enclosures, 0.8);
        this.enclosures = addPoolsToDisks(this.enclosures, 0.8);
        return;
      case MockEnclosureScenario.FillAllSlots:
        this.enclosures = addDisksToSlots(this.enclosures, 1);
        this.enclosures = addPoolsToDisks(this.enclosures, 1);
        return;
      case MockEnclosureScenario.DiskStatuses:
        this.enclosures = addDisksToSlots(this.enclosures, 0.8);
        this.enclosures = addPoolsToDisks(this.enclosures, 0.8);
        this.enclosures = randomizeDiskStatuses(this.enclosures);
        return;
      default:
        assertUnreachable(scenario);
    }
  }
}

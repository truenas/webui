import { enclosureMocks } from 'app/core/testing/mock-enclosure/enclosure-templates';
import { addDisksToMostSlots } from 'app/core/testing/mock-enclosure/enclosure-templates/utils/disk.utils';
import { addPoolsToMostDisks } from 'app/core/testing/mock-enclosure/enclosure-templates/utils/pool.utils';
import { MockStorageScenario } from 'app/core/testing/mock-enclosure/enums/mock-storage.enum';
import { MockEnclosureConfig } from 'app/core/testing/mock-enclosure/interfaces/mock-enclosure.interface';
import { ApiCallResponse } from 'app/interfaces/api/api-call-directory.interface';
import { DashboardEnclosure } from 'app/interfaces/enclosure.interface';

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

  private addEnclosure(model: string): void {
    const enclosure = enclosureMocks.get(model);

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

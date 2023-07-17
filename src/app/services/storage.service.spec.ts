import { HttpClient } from '@angular/common/http';
import { MockStorageScenario } from 'app/core/testing/enums/mock-storage.enum';
import { AddTopologyOptions } from 'app/core/testing/interfaces/mock-storage-generator.interface';
import { MockStorageGenerator } from 'app/core/testing/utils/mock-storage-generator.utils';
import { VdevType, TopologyItemType, TopologyWarning } from 'app/enums/v-dev-type.enum';
import { TopologyDisk, TopologyItem, VDev } from 'app/interfaces/storage.interface';
import { StorageService } from 'app/services/storage.service';
import { WebSocketService } from 'app/services/ws.service';

describe('StorageService', () => {
  const storageService = new StorageService(
    {} as WebSocketService,
    {} as HttpClient,
  );

  describe('getRedundancyLevel', () => {
    it('return width minus one with mirrors', () => {
      const mirror = {
        type: TopologyItemType.Mirror,
        children: [{}, {}, {}] as TopologyDisk[],
      } as VDev;
      const redundancy = storageService.getRedundancyLevel(mirror as TopologyItem);

      expect(redundancy).toBe(2);
    });

    it('return 0 disk redundancy for Stripe and Disk', () => {
      const stripe = storageService.getRedundancyLevel({ type: TopologyItemType.Stripe } as TopologyItem);
      expect(stripe).toBe(0);

      const disk = storageService.getRedundancyLevel({ type: TopologyItemType.Disk } as TopologyItem);
      expect(disk).toBe(0);
    });

    it('return 1 disk redundancy for Raidz and Raidz1', () => {
      const raidz = storageService.getRedundancyLevel({ type: TopologyItemType.Raidz } as TopologyItem);
      expect(raidz).toBe(1);

      const raidz1 = storageService.getRedundancyLevel({ type: TopologyItemType.Raidz1 } as TopologyItem);
      expect(raidz1).toBe(1);
    });

    it('return 2 disk redundancy for Raidz2', () => {
      const raidz2 = storageService.getRedundancyLevel({ type: TopologyItemType.Raidz2 } as TopologyItem);
      expect(raidz2).toBe(2);
    });

    it('return 3 disk redundancy for Raidz3', () => {
      const raidz3 = storageService.getRedundancyLevel({ type: TopologyItemType.Raidz3 } as TopologyItem);
      expect(raidz3).toBe(3);
    });

    it('return -1 for anything else', () => {
      const unsupported: TopologyItemType[] = [
        TopologyItemType.Missing,
        TopologyItemType.File,
        TopologyItemType.L2Cache,
        TopologyItemType.Replacing,
        TopologyItemType.Root,
      ];

      unsupported.forEach((layout: TopologyItemType) => {
        const unsupportedLayout = storageService.getRedundancyLevel({ type: layout } as TopologyItem);
        expect(unsupportedLayout).toBe(-1);
      });
    });
  });

  describe('can check VDEV widths', () => {
    const mockStorage = new MockStorageGenerator();
    const dataOptions: AddTopologyOptions = {
      scenario: MockStorageScenario.Uniform,
      layout: TopologyItemType.Raidz2,
      diskSize: 8,
      width: 8,
      repeats: 6,
    };
    // Add Topologies to Storage
    mockStorage.addDataTopology(dataOptions).addCacheTopology(3, 2);

    it('detects width of VDEVs', () => {
      const vdevWidth = storageService.getVdevWidths(mockStorage.poolState.topology.data);

      expect(vdevWidth.size).toBe(1);
      expect(vdevWidth.values().next().value).toBe(dataOptions.width);
    });

    it('detects width of Stripes and Disks', () => {
      const stripeWidth: Set<number> = storageService.getVdevWidths(mockStorage.poolState.topology.cache);

      expect(stripeWidth.size).toBe(1);
      expect(stripeWidth.values().next().value).toBe(1);
    });

    it('detects mixed VDEV widths', () => {
      const mixed = [1, 2, 3];
      const uniform = [1, 1, 1];
      const mixedIsMixed: boolean = storageService.isMixedWidth(new Set(mixed));
      const uniformIsMixed: boolean = storageService.isMixedWidth(new Set(uniform));

      expect(mixedIsMixed).toBe(true);
      expect(uniformIsMixed).toBe(false);
    });
  });

  describe('can check VDEV capacities', () => {
    const mockStorage = new MockStorageGenerator();
    const dataOptions: AddTopologyOptions = {
      scenario: MockStorageScenario.MixedVdevCapacity,
      layout: TopologyItemType.Mirror,
      diskSize: 2,
      width: 2,
      repeats: 2,
    };
    const dedupOptions: AddTopologyOptions = {
      scenario: MockStorageScenario.Uniform,
      layout: TopologyItemType.Mirror,
      diskSize: 2,
      width: 2,
      repeats: 2,
    };

    mockStorage.addDataTopology(dataOptions).addDedupTopology(dedupOptions);

    /*
    * NOTE: When setting options.scenario to MixedVdevCapacity, the Storage
    * Generator will make the first VDEV 2 TB larger than configured.
    * So first MIRROR will be 2 x 4 TiB and second VDEV will be 2 x 2 TiB as
    * specified by options.diskSize.
    * */

    const dataVdevCapacities: Set<number> = storageService.getVdevCapacities(mockStorage.poolState.topology.data);
    const dedupVdevCapacities: Set<number> = storageService.getVdevCapacities(mockStorage.poolState.topology.dedup);

    it('detects VDEV capacity for category', () => {
      const capacities: number[] = Array.from(dataVdevCapacities);
      expect(capacities[0]).toBe(mockStorage.terabytesToBytes(dataOptions.diskSize + 2));

      for (let index = 1; index < capacities.length; index++) {
        expect(capacities[index]).toBe(mockStorage.terabytesToBytes(dataOptions.diskSize));
        expect(capacities[index]).toEqual(mockStorage.poolState.topology.data[index].stats.size);
      }
    });

    it('detects mixed VDEV capacities in category', () => {
      // Check mixed data VDEVs
      expect(dataVdevCapacities.size).toBe(2);
      const isDataMixed: boolean = storageService.isMixedVdevCapacity(dataVdevCapacities);
      expect(isDataMixed).toBe(true);

      // Check uniform dedup VDEVs
      expect(dedupVdevCapacities.size).toBe(1);
      const isDedupMixed: boolean = storageService.isMixedVdevCapacity(dedupVdevCapacities);
      expect(isDedupMixed).toBe(false);
    });
  });

  describe('can check VDEV disk capacities in category', () => {
    const mockStorage = new MockStorageGenerator();
    const configuredDiskSize = 4;
    const generatedDiskSizeInBytes: number = mockStorage.terabytesToBytes(configuredDiskSize + 1);

    mockStorage.addDataTopology({
      scenario: MockStorageScenario.MixedDiskCapacity,
      layout: TopologyItemType.Raidz1,
      diskSize: configuredDiskSize,
      width: 4,
      repeats: 1,
    }).addDedupTopology({
      scenario: MockStorageScenario.MixedVdevCapacity,
      layout: TopologyItemType.Raidz1,
      diskSize: configuredDiskSize,
      width: 4,
      repeats: 2,
    }).addSpecialTopology({
      scenario: MockStorageScenario.Uniform,
      layout: TopologyItemType.Raidz1,
      diskSize: configuredDiskSize,
      width: 4,
      repeats: 1,
    });

    /*
    * NOTE: When generating a MixedDiskCapacity setting, Mock Storage Generator
    * will make the first disk of every VDEV 1 TiB larger than specified
    * */

    const dataDiskSizes = storageService.getVdevDiskCapacities(
      mockStorage.poolState.topology.data,
      mockStorage.disks,
    );

    const specialDiskSizes = storageService.getVdevDiskCapacities(
      mockStorage.poolState.topology.special,
      mockStorage.disks,
    );

    const dedupDiskSizes = storageService.getVdevDiskCapacities(
      mockStorage.poolState.topology.dedup,
      mockStorage.disks,
    );

    it('checks for disk capacity', () => {
      expect(dataDiskSizes[0].has(generatedDiskSizeInBytes)).toBe(true);
      expect(specialDiskSizes[0].has(generatedDiskSizeInBytes)).toBe(false);
      expect(dedupDiskSizes[0].has(generatedDiskSizeInBytes)).toBe(false);
      expect(dedupDiskSizes[1].has(generatedDiskSizeInBytes)).toBe(false);
    });

    it('detects mixed disk capacities within a VDEV', () => {
      const isDataMixed = storageService.isMixedVdevDiskCapacity(dataDiskSizes);
      const isDedupMixed = storageService.isMixedVdevDiskCapacity(dedupDiskSizes);
      const isSpecialMixed = storageService.isMixedVdevDiskCapacity(specialDiskSizes);

      expect(isDataMixed).toBe(true);
      expect(isSpecialMixed).toBe(false);
      expect(isDedupMixed).toBe(false);

      /*
      * NOTE: Disk capacities are checked on a per VDEV basis.
      * This is why Dedup topology returns false even though
      * there are different disk sizes in each VDEV
      * */
    });
  });

  describe('detects mixed VDEV types', () => {
    const mockStorage = new MockStorageGenerator();

    mockStorage.addDataTopology({
      scenario: MockStorageScenario.MixedVdevLayout,
      layout: TopologyItemType.Mirror,
      diskSize: 4,
      width: 2,
      repeats: 1,
    }).addSpecialTopology({
      scenario: MockStorageScenario.Uniform,
      layout: TopologyItemType.Raidz1,
      diskSize: 4,
      width: 4,
      repeats: 1,
    });

    const dataLayouts = storageService.getVdevTypes(mockStorage.poolState.topology.data);
    const specialLayouts = storageService.getVdevTypes(mockStorage.poolState.topology.special);

    it('can detect VDEV layouts', () => {
      expect(dataLayouts.size).toBe(2);
      expect(specialLayouts.size).toBe(1);
    });

    it('can detect mixed layouts', () => {
      const isDataMixed: boolean = storageService.isMixedVdevType(dataLayouts);
      const isSpecialMixed: boolean = storageService.isMixedVdevType(specialLayouts);

      expect(isDataMixed).toBe(true);
      expect(isSpecialMixed).toBe(false);
    });
  });

  describe('VDEV validator', () => {
    /*
    * NOTE:
    * Validator generally only validates a single topology category at a time.
    * The only exception to this is with Special and Dedup VDEVs. Best practices
    * dictate that the redundancy level should match the Data VDEVs. For this reason
    * we also pass in the data topology to the validator.
    * */

    it('generates warning for "No Redundancy"', () => {
      const stripeStorage = new MockStorageGenerator();

      stripeStorage.addDataTopology({
        scenario: MockStorageScenario.NoRedundancy,
        layout: TopologyItemType.Stripe,
        diskSize: 4,
        width: 1,
        repeats: 2,
      });

      const warnings = storageService.validateVdevs(
        VdevType.Data,
        stripeStorage.poolState.topology.data,
        stripeStorage.disks,
      );

      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toBe(TopologyWarning.NoRedundancy);
    });

    it('generates warning for "Mixed VDEV Capacities"', () => {
      const storage = new MockStorageGenerator();

      storage.addDataTopology({
        scenario: MockStorageScenario.MixedVdevCapacity,
        layout: TopologyItemType.Mirror,
        diskSize: 4,
        width: 2,
        repeats: 3,
      });

      const warnings = storageService.validateVdevs(
        VdevType.Data,
        storage.poolState.topology.data,
        storage.disks,
      );

      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toBe(TopologyWarning.MixedVdevCapacity);
    });

    it('generates warning for "Mixed Disk Capacities"', () => {
      const storage = new MockStorageGenerator();

      storage.addDataTopology({
        scenario: MockStorageScenario.MixedDiskCapacity,
        layout: TopologyItemType.Mirror,
        diskSize: 4,
        width: 2,
        repeats: 3,
      });

      const warnings = storageService.validateVdevs(
        VdevType.Data,
        storage.poolState.topology.data,
        storage.disks,
      );

      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toBe(TopologyWarning.MixedDiskCapacity);
    });

    it('generates warning for "Mixed VDEV Width"', () => {
      const storage = new MockStorageGenerator();

      storage.addDataTopology({
        scenario: MockStorageScenario.MixedVdevWidth,
        layout: TopologyItemType.Mirror,
        diskSize: 4,
        width: 2,
        repeats: 3,
      });

      const warnings = storageService.validateVdevs(
        VdevType.Data,
        storage.poolState.topology.data,
        storage.disks,
      );

      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toBe(TopologyWarning.MixedVdevWidth);
    });

    it('generates warning for "Mixed VDEV Layouts"', () => {
      const storage = new MockStorageGenerator();

      storage.addDataTopology({
        scenario: MockStorageScenario.MixedVdevLayout,
        layout: TopologyItemType.Mirror,
        diskSize: 4,
        width: 2,
        repeats: 3,
      });

      const warnings = storageService.validateVdevs(
        VdevType.Data,
        storage.poolState.topology.data,
        storage.disks,
      );

      // Will trigger multiple warnings as VDEV widths will differ.
      // Let's just check to see if the our warning is present
      expect(warnings).toContain(TopologyWarning.MixedVdevLayout);
    });

    it('generates warning for "Redundancy Mismatch"', () => {
      /*
      * NOTE: Special and Dedup categories should match redundancy level of data VDEVs
      * */

      const storage = new MockStorageGenerator();

      storage.addDataTopology({
        scenario: MockStorageScenario.Uniform,
        layout: TopologyItemType.Raidz3,
        diskSize: 4,
        width: 7,
        repeats: 2,
      }).addSpecialTopology({
        scenario: MockStorageScenario.Uniform,
        layout: TopologyItemType.Mirror,
        diskSize: 4,
        width: 3,
        repeats: 1,
      });

      const warnings = storageService.validateVdevs(
        VdevType.Special,
        storage.poolState.topology.special,
        storage.disks,
        storage.poolState.topology.data,
      );

      expect(warnings).toHaveLength(1);
      expect(warnings).toContain(TopologyWarning.RedundancyMismatch);
    });
  });
});

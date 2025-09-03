import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { GpuPciChoices } from 'app/interfaces/gpu-pci-choice.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { CriticalGpuPreventionService } from 'app/services/gpu/critical-gpu-prevention.service';
import { GpuService } from 'app/services/gpu/gpu.service';

@UntilDestroy()
@Component({
  selector: 'ix-mock-component',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MockComponent {}

describe('CriticalGpuPreventionService', () => {
  let spectator: SpectatorService<CriticalGpuPreventionService>;
  const mockGpuChoices: GpuPciChoices = {
    'Safe GPU [0000:01:00.0]': {
      pci_slot: '0000:01:00.0',
      uses_system_critical_devices: false,
      critical_reason: '',
    },
    'Critical GPU [0000:02:00.0]': {
      pci_slot: '0000:02:00.0',
      uses_system_critical_devices: true,
      critical_reason: 'Uses system critical devices',
    },
  };

  const createService = createServiceFactory({
    service: CriticalGpuPreventionService,
    mocks: [DialogService, TranslateService],
    providers: [
      {
        provide: GpuService,
        useValue: {
          getRawGpuPciChoices: jest.fn(() => of(mockGpuChoices)),
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  describe('setupCriticalGpuPrevention', () => {
    let control: FormControl<string[]>;
    let mockComponent: MockComponent;

    beforeEach(() => {
      control = new FormControl<string[]>([]);
      mockComponent = new MockComponent();
    });

    it('should use provided observable when available', () => {
      const customChoices$ = of({
        'Custom GPU': {
          pci_slot: '0000:03:00.0',
          uses_system_critical_devices: false,
          critical_reason: '',
        },
      });

      const criticalGpus = spectator.service.setupCriticalGpuPrevention(
        control,
        mockComponent,
        'Test Title',
        'Test Message',
        customChoices$,
      );

      // The service should not call getRawGpuPciChoices when custom observable is provided
      expect(spectator.inject(GpuService).getRawGpuPciChoices).not.toHaveBeenCalled();

      // Map should be empty initially since the custom GPU is not critical
      expect(criticalGpus.size).toBe(0);
    });

    it('should fall back to GpuService when no observable is provided', () => {
      const criticalGpus = spectator.service.setupCriticalGpuPrevention(
        control,
        mockComponent,
        'Test Title',
        'Test Message',
      );

      // The service should call getRawGpuPciChoices when no custom observable is provided
      expect(spectator.inject(GpuService).getRawGpuPciChoices).toHaveBeenCalled();

      // Map should contain the critical GPU from mock data
      expect(criticalGpus.size).toBe(1);
      expect(criticalGpus.has('0000:02:00.0')).toBe(true);
      expect(criticalGpus.get('0000:02:00.0')).toBe('Uses system critical devices');
    });

    it('should prevent selection of critical GPUs', () => {
      const dialogService = spectator.inject(DialogService);
      const translateService = spectator.inject(TranslateService);
      jest.spyOn(translateService, 'instant').mockImplementation((key: string) => key as TranslatedString);

      spectator.service.setupCriticalGpuPrevention(
        control,
        mockComponent,
        'Cannot Select GPU',
        'System critical GPUs cannot be used',
      );

      // Try to select a critical GPU
      control.setValue(['0000:01:00.0', '0000:02:00.0']);

      // The control should only have the safe GPU
      expect(control.value).toEqual(['0000:01:00.0']);

      // Dialog should have been shown
      expect(dialogService.error).toHaveBeenCalledWith({
        title: 'Cannot Select GPU',
        message: expect.stringContaining('Uses system critical devices'),
      });
    });

    it('should handle empty critical_reason', () => {
      const dialogService = spectator.inject(DialogService);
      const translateService = spectator.inject(TranslateService);
      jest.spyOn(translateService, 'instant').mockImplementation((key: string) => key as TranslatedString);

      const choicesWithEmptyReason$ = of({
        'Critical GPU': {
          pci_slot: '0000:03:00.0',
          uses_system_critical_devices: true,
          critical_reason: '',
        },
      });

      const criticalGpus = spectator.service.setupCriticalGpuPrevention(
        control,
        mockComponent,
        'Cannot Select GPU',
        'Default message for critical GPU',
        choicesWithEmptyReason$,
      );

      expect(criticalGpus.get('0000:03:00.0')).toBe('');

      // Try to select the critical GPU
      control.setValue(['0000:03:00.0']);

      // Should use the default message when critical_reason is empty
      expect(dialogService.error).toHaveBeenCalledWith({
        title: 'Cannot Select GPU',
        message: expect.stringContaining('Default message for critical GPU'),
      });
    });
  });
});

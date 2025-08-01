import { Injectable, inject } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/modules/websocket/api.service';

@Injectable({ providedIn: 'root' })
export class CriticalGpuPreventionService {
  private api = inject(ApiService);
  private dialog = inject(DialogService);
  private translate = inject(TranslateService);


  setupCriticalGpuPrevention(
    control: AbstractControl<string[]>,
    component: object, // Component with untilDestroyed
    dialogTitle: string,
    defaultMessage: string,
  ): Map<string, string> {
    const criticalGpus = new Map<string, string>();

    // Load critical GPUs information
    this.api.call('system.advanced.get_gpu_pci_choices').pipe(
      untilDestroyed(component),
    ).subscribe((choices) => {
      criticalGpus.clear();
      Object.entries(choices).forEach(([, choice]) => {
        if (choice.uses_system_critical_devices) {
          criticalGpus.set(choice.pci_slot, choice.critical_reason);
        }
      });
    });

    // Prevent selection of critical GPUs
    control.valueChanges
      .pipe(untilDestroyed(component))
      .subscribe((selectedIds) => {
        if (!selectedIds || selectedIds.length === 0) {
          return;
        }

        const criticalSelectedIds = selectedIds.filter((id) => criticalGpus.has(id));

        if (criticalSelectedIds.length > 0) {
          // Remove critical GPUs from selection
          const filteredIds = selectedIds.filter((id) => !criticalGpus.has(id));
          control.setValue(filteredIds, { emitEvent: false });

          // Show error with the critical reason
          const criticalReason = criticalGpus.get(criticalSelectedIds[0]);
          const infoBlurb = this.translate.instant('In order to isolate GPU the device cannot share memory management with other devices.');
          const message = criticalReason || this.translate.instant(defaultMessage);
          this.dialog.error({
            title: this.translate.instant(dialogTitle),
            message: `${message}<br><br><i>${infoBlurb}</i>`,
          });
        }
      });

    return criticalGpus;
  }
}

import {
  ChangeDetectionStrategy, Component, OnInit, ViewChild,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { GiB, MiB } from 'app/constants/bytes.constant';
import { VmOs } from 'app/enums/vm.enum';
import { SummarySection } from 'app/modules/common/summary/summary.interface';
import { OsStepComponent } from 'app/pages/vm/vm-wizard/steps/1-os-step/os-step.component';
import {
  CpuAndMemoryStepComponent,
} from 'app/pages/vm/vm-wizard/steps/2-cpu-and-memory-step/cpu-and-memory-step.component';
import { DiskStepComponent } from 'app/pages/vm/vm-wizard/steps/3-disks-step/disk-step.component';
import {
  NetworkInterfaceStepComponent,
} from 'app/pages/vm/vm-wizard/steps/4-network-interface-step/network-interface-step.component';
import {
  InstallationMediaStepComponent,
} from 'app/pages/vm/vm-wizard/steps/5-installation-media-step/installation-media-step.component';
import { GpuStepComponent } from 'app/pages/vm/vm-wizard/steps/6-gpu-step/gpu-step.component';

@UntilDestroy()
@Component({
  templateUrl: './vm-wizard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VmWizardComponent implements OnInit {
  @ViewChild(OsStepComponent, { static: true }) osStep: OsStepComponent;
  @ViewChild(CpuAndMemoryStepComponent, { static: true }) cpuAndMemoryStep: CpuAndMemoryStepComponent;
  @ViewChild(DiskStepComponent, { static: true }) diskStep: DiskStepComponent;
  @ViewChild(NetworkInterfaceStepComponent, { static: true }) networkInterfaceStep: NetworkInterfaceStepComponent;
  @ViewChild(InstallationMediaStepComponent, { static: true }) installationMediaStep: InstallationMediaStepComponent;
  @ViewChild(GpuStepComponent, { static: true }) gpuStep: GpuStepComponent;

  isLoading = false;
  summary: SummarySection[];

  ngOnInit(): void {
    this.setDefaultsFromOs();
  }

  updateSummary(): void {
    const steps = [
      this.osStep,
      this.cpuAndMemoryStep,
      this.diskStep,
      this.networkInterfaceStep,
      this.installationMediaStep,
      this.gpuStep,
    ];

    this.summary = steps.map((step) => step.getSummary());
  }

  onSubmit(): void {
    // TODO: If enable_display is true, query vm.port_wizard to get port number to use when creating a VM.
  }

  private setDefaultsFromOs(): void {
    this.osStep.form.controls.os.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((os) => {
        if (os === VmOs.Windows) {
          this.cpuAndMemoryStep.form.patchValue({
            vcpus: 2,
            cores: 1,
            threads: 1,
            memory: 4 * GiB,
          });
          this.diskStep.form.patchValue({
            volsize: 40 * GiB,
          });
        } else {
          this.cpuAndMemoryStep.form.patchValue({
            vcpus: 1,
            cores: 1,
            threads: 1,
            memory: 512 * MiB,
          });
          this.diskStep.form.patchValue({
            volsize: 10 * GiB,
          });
        }
      });
  }
}

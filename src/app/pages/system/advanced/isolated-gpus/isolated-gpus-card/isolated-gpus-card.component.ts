import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Device } from 'app/interfaces/device.interface';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import {
  IsolatedGpusFormComponent,
} from 'app/pages/system/advanced/isolated-gpus/isolated-gpus-form/isolated-gpus-form.component';
import { GpuService } from 'app/services/gpu/gpu.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-isolated-gpus-card',
  styleUrls: ['../../common-card.scss'],
  templateUrl: './isolated-gpus-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IsolatedGpusCardComponent implements OnInit {
  isolatedGpus: Device[] = [];

  readonly emptyConfig = {
    type: EmptyType.NoPageData,
    title: this.translate.instant('No Isolated GPU Device(s) configured'),
    large: false,
    message: this.translate.instant('To configure Isolated GPU Device(s), click the "Configure" button.'),
  };

  constructor(
    private slideIn: IxSlideInService,
    private advancedSettings: AdvancedSettingsService,
    private gpuService: GpuService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
  ) {}

  get isolatedGpuNames(): string {
    return this.isolatedGpus.map((gpu) => gpu.description).join(', ');
  }

  ngOnInit(): void {
    this.loadIsolatedGpus();

    this.slideIn.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      this.loadIsolatedGpus();
    });
  }

  async onConfigurePressed(): Promise<void> {
    await this.advancedSettings.showFirstTimeWarningIfNeeded();

    this.slideIn.open(IsolatedGpusFormComponent);
  }

  private loadIsolatedGpus(): void {
    this.gpuService.getIsolatedGpus().pipe(untilDestroyed(this)).subscribe((gpus) => {
      this.isolatedGpus = gpus;
      this.cdr.markForCheck();
    });
  }
}

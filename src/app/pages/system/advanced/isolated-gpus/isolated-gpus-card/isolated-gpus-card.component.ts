import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCardComponent, TnCardFooterActionsDirective, TnEmptyComponent,
} from '@truenas/ui-components';
import { take } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { Device } from 'app/interfaces/device.interface';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { isolatedGpusCardElements } from 'app/pages/system/advanced/isolated-gpus/isolated-gpus-card/isolated-gpus-card.elements';
import {
  IsolatedGpusFormComponent,
} from 'app/pages/system/advanced/isolated-gpus/isolated-gpus-form/isolated-gpus-form.component';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
import { GpuService } from 'app/services/gpu/gpu.service';

@Component({
  selector: 'ix-isolated-gpus-card',
  styleUrls: ['./isolated-gpus-card.component.scss'],
  templateUrl: './isolated-gpus-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardFooterActionsDirective,
    TnEmptyComponent,
    UiSearchDirective,
    RequiresRolesDirective,
    TnButtonComponent,
    TranslateModule,
  ],
})
export class IsolatedGpusCardComponent implements OnInit {
  private firstTimeWarning = inject(FirstTimeWarningService);
  private gpuService = inject(GpuService);
  private cdr = inject(ChangeDetectorRef);
  private translate = inject(TranslateService);
  private formPanel = inject(FormSidePanelService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.SystemAdvancedWrite];

  isolatedGpus: Device[] = [];
  protected readonly searchableElements = isolatedGpusCardElements;

  get isolatedGpuNames(): string {
    return this.isolatedGpus.map((gpu) => gpu.description).join(', ');
  }

  ngOnInit(): void {
    this.loadIsolatedGpus();
  }

  onConfigurePressed(): void {
    this.firstTimeWarning.showFirstTimeWarningIfNeeded().pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.formPanel.open(IsolatedGpusFormComponent, {
        title: this.translate.instant('Isolated GPU Device(s)'),
      }).onSuccess(() => this.loadIsolatedGpus(), this.destroyRef);
    });
  }

  private loadIsolatedGpus(): void {
    this.gpuService.getIsolatedGpus().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((gpus) => {
      this.isolatedGpus = gpus;
      this.cdr.markForCheck();
    });
  }
}

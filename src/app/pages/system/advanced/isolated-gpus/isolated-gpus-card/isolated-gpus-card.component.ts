import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, signal, viewChild, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCardComponent, TnCardFooterActionsDirective, TnEmptyComponent,
  TnSidePanelActionDirective, TnSidePanelComponent,
} from '@truenas/ui-components';
import { Observable, of, take } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { Device } from 'app/interfaces/device.interface';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';
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
    TnSidePanelComponent,
    TnSidePanelActionDirective,
    TnEmptyComponent,
    UiSearchDirective,
    RequiresRolesDirective,
    TnButtonComponent,
    IsolatedGpusFormComponent,
    TranslateModule,
  ],
})
export class IsolatedGpusCardComponent implements OnInit {
  private firstTimeWarning = inject(FirstTimeWarningService);
  private gpuService = inject(GpuService);
  private cdr = inject(ChangeDetectorRef);
  private unsavedChanges = inject(UnsavedChangesService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.SystemAdvancedWrite];

  isolatedGpus: Device[] = [];
  protected readonly searchableElements = isolatedGpusCardElements;

  protected configOpen = signal(false);
  protected configForm = viewChild(IsolatedGpusFormComponent);

  get isolatedGpuNames(): string {
    return this.isolatedGpus.map((gpu) => gpu.description).join(', ');
  }

  ngOnInit(): void {
    this.loadIsolatedGpus();
  }

  protected readonly closeGuard = (): Observable<boolean> => {
    return this.configForm()?.hasUnsavedChanges()
      ? this.unsavedChanges.showConfirmDialog()
      : of(true);
  };

  onConfigurePressed(): void {
    this.firstTimeWarning.showFirstTimeWarningIfNeeded().pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.configOpen.set(true));
  }

  protected onConfigClosed(saved: boolean): void {
    this.configOpen.set(false);
    if (saved) {
      this.loadIsolatedGpus();
    }
  }

  private loadIsolatedGpus(): void {
    this.gpuService.getIsolatedGpus().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((gpus) => {
      this.isolatedGpus = gpus;
      this.cdr.markForCheck();
    });
  }
}

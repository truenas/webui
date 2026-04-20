import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, input, OnInit, output, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatStepperPrevious, MatStepperNext } from '@angular/material/stepper';
import { TranslateModule } from '@ngx-translate/core';
import { combineLatest, distinctUntilChanged, map } from 'rxjs';
import { CreateVdevLayout, VDevType } from 'app/enums/v-dev-type.enum';
import { helptextPoolCreation } from 'app/helptext/storage/volumes/pool-creation/pool-creation';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AddVdevsStore } from 'app/pages/storage/modules/pool-manager/components/add-vdevs/store/add-vdevs-store.service';
import { LayoutStepComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/layout-step.component';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { nonDraidLayouts, resolveSpecialLayoutLock } from 'app/pages/storage/modules/pool-manager/utils/topology.utils';

@Component({
  selector: 'ix-dedup-wizard-step',
  templateUrl: './dedup-wizard-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LayoutStepComponent,
    FormActionsComponent,
    MatButton,
    MatStepperPrevious,
    TestDirective,
    MatStepperNext,
    TranslateModule,
    AsyncPipe,
  ],
})
export class DedupWizardStepComponent implements OnInit {
  private addVdevsStore = inject(AddVdevsStore);
  private store = inject(PoolManagerStore);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  readonly isStepActive = input<boolean>(false);
  readonly stepWarning = input<string | null>();

  readonly goToLastStep = output();

  protected canChangeLayout = true;

  protected readonly vDevType = VDevType;
  protected readonly helptext = helptextPoolCreation;

  protected readonly inventory$ = this.store.getInventoryForStep(VDevType.Dedup);
  protected allowedLayouts: CreateVdevLayout[] = [...nonDraidLayouts];

  protected goToReviewStep(): void {
    this.goToLastStep.emit();
  }

  protected resetStep(): void {
    this.store.resetStep(VDevType.Dedup);
  }

  ngOnInit(): void {
    combineLatest([this.addVdevsStore.pool$, this.store.topology$]).pipe(
      map(([pool, topology]) => resolveSpecialLayoutLock(
        pool?.topology[VDevType.Dedup],
        pool?.topology[VDevType.Data],
        topology[VDevType.Data]?.layout,
      )),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((layout) => {
      if (!layout) {
        this.allowedLayouts = [...nonDraidLayouts];
        this.canChangeLayout = true;
      } else {
        this.allowedLayouts = [layout];
        this.canChangeLayout = false;
      }
      this.cdr.markForCheck();
    });
  }
}

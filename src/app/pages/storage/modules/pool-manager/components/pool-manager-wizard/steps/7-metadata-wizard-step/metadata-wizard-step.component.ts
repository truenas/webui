import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, input, OnInit, output, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatStepperPrevious, MatStepperNext } from '@angular/material/stepper';
import { TranslateModule } from '@ngx-translate/core';
import { take } from 'rxjs';
import { CreateVdevLayout, VDevType } from 'app/enums/v-dev-type.enum';
import { helptextPoolCreation } from 'app/helptext/storage/volumes/pool-creation/pool-creation';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AddVdevsStore } from 'app/pages/storage/modules/pool-manager/components/add-vdevs/store/add-vdevs-store.service';
import { LayoutStepComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/layout-step.component';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { lockedSpecialLayout$, nonDraidLayouts } from 'app/pages/storage/modules/pool-manager/utils/topology.utils';

@Component({
  selector: 'ix-metadata-wizard-step',
  templateUrl: './metadata-wizard-step.component.html',
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
export class MetadataWizardStepComponent implements OnInit {
  private addVdevsStore = inject(AddVdevsStore);
  private store = inject(PoolManagerStore);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  readonly isStepActive = input<boolean>(false);
  readonly stepWarning = input<string | null>();

  readonly goToLastStep = output();

  protected readonly vDevType = VDevType;
  protected readonly helptext = helptextPoolCreation;

  protected readonly inventory$ = this.store.getInventoryForStep(VDevType.Special);
  protected allowedLayouts: CreateVdevLayout[] = [...nonDraidLayouts];

  protected goToReviewStep(): void {
    this.goToLastStep.emit();
  }

  protected resetStep(): void {
    this.store.resetStep(VDevType.Special);
  }

  ngOnInit(): void {
    lockedSpecialLayout$(this.addVdevsStore.pool$, this.store.topology$, VDevType.Special).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((layout) => {
      this.allowedLayouts = layout ? [layout] : [...nonDraidLayouts];
      this.resetIfCurrentLayoutNotAllowed();
      this.cdr.markForCheck();
    });
  }

  private resetIfCurrentLayoutNotAllowed(): void {
    this.store.topology$.pipe(take(1)).subscribe((topology) => {
      const currentLayout = topology[VDevType.Special]?.layout;
      if (currentLayout && !this.allowedLayouts.includes(currentLayout)) {
        this.store.resetStep(VDevType.Special);
      }
    });
  }
}

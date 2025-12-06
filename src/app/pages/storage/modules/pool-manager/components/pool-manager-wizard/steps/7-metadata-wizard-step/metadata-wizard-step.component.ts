import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, input, OnInit, output, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatStepperPrevious, MatStepperNext } from '@angular/material/stepper';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { map } from 'rxjs';
import { CreateVdevLayout, TopologyItemType, VDevType } from 'app/enums/v-dev-type.enum';
import { helptextPoolCreation } from 'app/helptext/storage/volumes/pool-creation/pool-creation';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AddVdevsStore } from 'app/pages/storage/modules/pool-manager/components/add-vdevs/store/add-vdevs-store.service';
import { LayoutStepComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/layout-step.component';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { parseDraidVdevName } from 'app/pages/storage/modules/pool-manager/utils/topology.utils';

@UntilDestroy()
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

  readonly isStepActive = input<boolean>(false);
  readonly stepWarning = input<string | null>();

  readonly goToLastStep = output();

  canChangeLayout = true;

  protected readonly vDevType = VDevType;
  readonly helptext = helptextPoolCreation;

  protected readonly inventory$ = this.store.getInventoryForStep(VDevType.Special);
  protected allowedLayouts = Object.values(CreateVdevLayout) as CreateVdevLayout[];

  goToReviewStep(): void {
    this.goToLastStep.emit();
  }

  resetStep(): void {
    this.store.resetStep(VDevType.Special);
  }

  ngOnInit(): void {
    this.addVdevsStore.pool$.pipe(
      map((pool) => pool?.topology[VDevType.Special]),
      untilDestroyed(this),
    ).subscribe((metadataTopology) => {
      if (!metadataTopology?.length) {
        return;
      }
      // TODO: Similar code in poolTopologyToStoreTopology
      let type = metadataTopology[0].type;
      if (type === TopologyItemType.Disk && !metadataTopology[0].children.length) {
        type = TopologyItemType.Stripe;
      } else if (type === TopologyItemType.Draid) {
        const parsedVdevName = parseDraidVdevName(metadataTopology[0].name);
        type = parsedVdevName.layout as unknown as TopologyItemType;
      }
      this.allowedLayouts = [type] as unknown as CreateVdevLayout[];
      this.canChangeLayout = false;
      this.cdr.markForCheck();
    });
  }
}

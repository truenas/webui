import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, input, OnInit, output, inject,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCheckboxComponent, TnDialog, TnFormFieldComponent, TnStepperPreviousDirective,
} from '@truenas/ui-components';
import { filter } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { VDevType, vdevTypeLabels } from 'app/enums/v-dev-type.enum';
import { isTopologyLimitedToOneLayout } from 'app/helpers/storage.helper';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import {
  InspectVdevsDialog,
} from 'app/pages/storage/modules/pool-manager/components/inspect-vdevs-dialog/inspect-vdevs-dialog.component';
import { EncryptionType } from 'app/pages/storage/modules/pool-manager/enums/encryption-type.enum';
import { PoolCreationSeverity } from 'app/pages/storage/modules/pool-manager/enums/pool-creation-severity';
import { PoolCreationError } from 'app/pages/storage/modules/pool-manager/interfaces/pool-creation-error';
import { TopologyCategoryDescriptionPipe } from 'app/pages/storage/modules/pool-manager/pipes/topology-category-description.pipe';
import { PoolManagerValidationService } from 'app/pages/storage/modules/pool-manager/store/pool-manager-validation.service';
import {
  PoolManagerState,
  PoolManagerStore,
  PoolManagerTopology, PoolManagerTopologyCategory,
} from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { AppState } from 'app/store';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

@Component({
  selector: 'ix-review-wizard-step',
  templateUrl: './review-wizard-step.component.html',
  styleUrls: ['./review-wizard-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnButtonComponent,
    TnStepperPreviousDirective,
    RequiresRolesDirective,
    ReactiveFormsModule,
    TnFormFieldComponent,
    TnCheckboxComponent,
    TranslateModule,
    FileSizePipe,
    MapValuePipe,
    AsyncPipe,
    TopologyCategoryDescriptionPipe,
    FormActionsComponent,
  ],
})
export class ReviewWizardStepComponent implements OnInit {
  private tnDialog = inject(TnDialog);
  private store = inject(PoolManagerStore);
  private systemStore$ = inject<Store<AppState>>(Store);
  private cdr = inject(ChangeDetectorRef);
  private dialogService = inject(DialogService);
  private translate = inject(TranslateService);
  private poolManagerValidation = inject(PoolManagerValidationService);
  private destroyRef = inject(DestroyRef);

  readonly isAddingVdevs = input<boolean>();

  readonly vDevType = VDevType;
  readonly createPool = output();

  // force_topology is a Community Edition escape hatch; middleware rejects it on Enterprise.
  protected readonly isEnterprise = toSignal(this.systemStore$.select(selectIsEnterprise));
  protected readonly forceTopologyControl = new FormControl(false, { nonNullable: true });

  state: PoolManagerState;
  nonEmptyTopologyCategories: [VDevType, PoolManagerTopologyCategory][] = [];
  poolCreationErrors: PoolCreationError[];
  isCreateDisabled = false;

  protected totalCapacity$ = this.store.totalUsableCapacity$;
  protected readonly vdevTypeLabels = vdevTypeLabels;
  protected isLimitedToOneLayout = isTopologyLimitedToOneLayout;

  protected readonly Role = Role;
  protected readonly EncryptionType = EncryptionType;

  get showStartOver(): boolean {
    return Boolean(
      this.state?.name
      || this.state?.encryptionType !== EncryptionType.None
      || this.nonEmptyTopologyCategories?.length,
    );
  }

  get hasVdevs(): boolean {
    return Object.keys(this.state.topology).some((type) => {
      return this.state.topology[type as VDevType].vdevs.length > 0;
    });
  }

  get limitToEnclosureName(): string | undefined {
    const limitToSingleEnclosure = this.state.enclosureSettings.limitToSingleEnclosure;
    if (limitToSingleEnclosure === null) {
      return undefined;
    }

    return this.state.enclosures.find((enclosure) => {
      return enclosure.id === this.state.enclosureSettings.limitToSingleEnclosure;
    })?.name;
  }

  ngOnInit(): void {
    this.store.state$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((state) => {
      this.state = state;
      this.nonEmptyTopologyCategories = this.filterNonEmptyCategories(state.topology);
      this.cdr.markForCheck();
    });

    this.poolManagerValidation.getPoolCreationErrors().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((errors) => {
      this.poolCreationErrors = errors;
      this.isCreateDisabled = !!errors.filter((error) => error.severity === PoolCreationSeverity.Error).length;
    });

    this.forceTopologyControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((forceTopology) => {
      this.store.setForceTopology(forceTopology);
    });
  }

  onInspectVdevsPressed(): void {
    this.tnDialog.open(InspectVdevsDialog, {
      data: {
        topology: this.state.topology,
        enclosures: this.state.enclosures,
      },
      panelClass: 'inspect-vdevs-dialog',
    });
  }

  private filterNonEmptyCategories(topology: PoolManagerTopology): [VDevType, PoolManagerTopologyCategory][] {
    return Object.keys(topology).reduce((acc, type) => {
      const category = topology[type as VDevType];
      if (category.vdevs.length > 0) {
        acc.push([type as VDevType, category]);
      }
      return acc;
    }, [] as [VDevType, PoolManagerTopologyCategory][]);
  }

  startOver(): void {
    this.dialogService
      .confirm({
        title: this.translate.instant('Start Over'),
        message: this.translate.instant('Are you sure you want to start over?'),
        hideCheckbox: false,
        buttonText: this.translate.instant('Start Over'),
      })
      .pipe(
        filter(Boolean),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe(() => {
        this.store.startOver();
      });
  }
}

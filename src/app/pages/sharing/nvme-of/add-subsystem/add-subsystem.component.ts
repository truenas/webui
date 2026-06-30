import {
  ChangeDetectionStrategy, Component, DestroyRef, computed, inject, output, signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCheckboxComponent, TnFormFieldComponent, TnInputComponent, TnStepComponent, TnStepperComponent,
} from '@truenas/ui-components';
import {
  catchError,
  finalize, forkJoin, map, Observable, of, startWith, switchMap,
  tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { helptextNvmeOf } from 'app/helptext/sharing/nvme-of/nvme-of';
import {
  CreateNvmeOfNamespace, NvmeOfHost, NvmeOfPort, NvmeOfSubsystem,
} from 'app/interfaces/nvme-of.interface';
import { DetailsItemComponent } from 'app/modules/details-table/details-item/details-item.component';
import { DetailsTableComponent } from 'app/modules/details-table/details-table.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EditableComponent } from 'app/modules/forms/editable/editable.component';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  AddSubsystemHostsComponent,
} from 'app/pages/sharing/nvme-of/add-subsystem/add-subsystem-hosts/add-subsystem-hosts.component';
import {
  AddSubsystemNamespacesComponent,

} from 'app/pages/sharing/nvme-of/add-subsystem/add-subsystem-namespaces/add-subsystem-namespaces.component';
import {
  AddSubsystemPortsComponent,
} from 'app/pages/sharing/nvme-of/add-subsystem/add-subsystem-ports/add-subsystem-ports.component';
import { NamespaceChanges } from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/namespace-changes.interface';
import { NvmeOfService } from 'app/pages/sharing/nvme-of/services/nvme-of.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { AppState } from 'app/store';
import { checkIfServiceIsEnabled } from 'app/store/services/services.actions';

@Component({
  selector: 'ix-add-subsystem',
  styleUrls: ['./add-subsystem.component.scss'],
  templateUrl: './add-subsystem.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    TranslateModule,
    ReactiveFormsModule,
    TnStepperComponent,
    TnStepComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnCheckboxComponent,
    TnButtonComponent,
    AddSubsystemHostsComponent,
    AddSubsystemNamespacesComponent,
    RequiresRolesDirective,
    AddSubsystemPortsComponent,
    DetailsItemComponent,
    DetailsTableComponent,
    EditableComponent,
  ],
})
export class AddSubsystemComponent {
  private formBuilder = inject(FormBuilder);
  /** Present when opened via legacy SlideIn host. Absent when hosted in `<tn-side-panel>`. */
  readonly slideInRef = inject<SlideInRef<void, NvmeOfSubsystem>>(SlideInRef, { optional: true });
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  private nvmeOfService = inject(NvmeOfService);
  private store$ = inject<Store<AppState>>(Store);
  private dialogService = inject(DialogService);
  private destroyRef = inject(DestroyRef);

  protected isLoading = signal(false);
  requiredRoles = [Role.SharingNvmeTargetWrite];

  /** Emitted with the created subsystem when hosted in a `<tn-side-panel>`. */
  readonly created = output<NvmeOfSubsystem>();

  /** Two-way bound to the stepper so a host footer can drive/observe the active step. */
  readonly currentStepIndex = signal(0);
  readonly isLastStep = computed(() => this.currentStepIndex() === 1);

  protected form = this.formBuilder.group({
    name: ['', Validators.required],
    subnqn: [''],
    namespaces: [[] as NamespaceChanges[]],

    allowAnyHost: [true],
    allowedHosts: [[] as NvmeOfHost[]],

    ports: [[] as NvmeOfPort[]],
  });

  protected readonly helptext = helptextNvmeOf;

  private readonly nameStatus = toSignal(
    this.form.controls.name.statusChanges.pipe(startWith(this.form.controls.name.status)),
    { initialValue: this.form.controls.name.status },
  );

  /** Whether step 1 is complete enough to advance — drives the panel footer's Next. */
  readonly canProceed = computed(() => this.nameStatus() === 'VALID');

  private readonly formStatus = toSignal(
    this.form.statusChanges.pipe(startWith(this.form.status)),
    { initialValue: this.form.status },
  );

  /** Whether the whole form can be submitted — drives the panel footer's Save. */
  readonly canSubmit = computed(() => this.formStatus() === 'VALID' && !this.isLoading());

  constructor() {
    this.slideInRef?.requireConfirmationWhen(() => of(this.hasUnsavedChanges()));
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty;
  }

  nextStep(): void {
    this.currentStepIndex.update((index) => index + 1);
  }

  previousStep(): void {
    this.currentStepIndex.update((index) => index - 1);
  }

  /** Public entry point for a `<tn-side-panel>` host's footer Save. */
  submit(): void {
    this.onSubmit();
  }

  protected onSubmit(): void {
    this.isLoading.set(true);

    this.createSubsystem().pipe(
      switchMap((subsystem) => {
        return this.createRelatedEntities(subsystem).pipe(
          map((relatedErrors) => ({ subsystem, relatedErrors })),
        );
      }),
      tap(() => this.store$.dispatch(checkIfServiceIsEnabled({ serviceName: ServiceName.NvmeOf }))),
      finalize(() => this.isLoading.set(false)),
      this.errorHandler.withErrorHandler(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(({ subsystem, relatedErrors }) => {
      if (subsystem && relatedErrors?.length > 0) {
        this.dialogService.subsystemPartiallyCreated({
          subsystem,
          relatedErrors,
        }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
      }

      this.snackbar.success(this.translate.instant('New subsystem added'));
      this.close(subsystem);
    });
  }

  private close(subsystem: NvmeOfSubsystem): void {
    if (this.slideInRef) {
      this.slideInRef.close({ response: subsystem });
    } else {
      this.created.emit(subsystem);
    }
  }

  private createRelatedEntities(subsystem: NvmeOfSubsystem): Observable<string[]> {
    const errors: string[] = [];

    const withErrorHandling = (source$: Observable<unknown>, label: string): Observable<unknown> => {
      return source$.pipe(
        catchError((err: unknown) => {
          const message = err instanceof Error ? err.message : String(err);
          errors.push(this.translate.instant('{label} Error: {error}', { label, error: message }));
          return of(null);
        }),
      );
    };

    const operations: Observable<unknown>[] = [
      withErrorHandling(this.nvmeOfService.associatePorts(subsystem, this.form.value.ports), this.translate.instant('Ports')),
    ];

    if (!this.form.value.allowAnyHost) {
      operations.push(
        withErrorHandling(this.nvmeOfService.associateHosts(subsystem, this.form.value.allowedHosts), this.translate.instant('Hosts')),
      );
    }

    if (this.form.value.namespaces?.length) {
      const namespaceOps = this.createNamespaces(subsystem, this.form.value.namespaces)
        .map((ns$) => withErrorHandling(ns$, 'Namespaces'));
      operations.push(...namespaceOps);
    }

    return forkJoin(operations).pipe(
      map(() => errors),
    );
  }

  private createSubsystem(): Observable<NvmeOfSubsystem> {
    const values = this.form.value;
    const payload = {
      name: values.name,
      subnqn: values.subnqn || null,
      allow_any_host: values.allowAnyHost,
    };

    return this.api.call('nvmet.subsys.create', [payload]);
  }

  private createNamespaces(subsystem: NvmeOfSubsystem, namespaces: NamespaceChanges[]): Observable<unknown>[] {
    return namespaces.map((namespace) => {
      const payload: CreateNvmeOfNamespace = {
        subsys_id: subsystem.id,
        device_type: namespace.device_type,
        filesize: namespace.filesize,
        device_path: namespace.device_path,
      };
      return this.api.call('nvmet.namespace.create', [payload]);
    });
  }
}

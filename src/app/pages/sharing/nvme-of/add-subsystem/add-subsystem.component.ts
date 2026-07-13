import {
  ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnCheckboxComponent, TnFormFieldComponent, TnInputComponent,
  TnStepComponent, TnStepperComponent,
} from '@truenas/ui-components';
import {
  catchError,
  finalize, forkJoin, map, Observable, of, switchMap,
  tap,
} from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { stepCompletedSignal } from 'app/helpers/step-completed-signal.helper';
import { helptextNvmeOf } from 'app/helptext/sharing/nvme-of/nvme-of';
import {
  CreateNvmeOfNamespace, NvmeOfHost, NvmeOfPort, NvmeOfSubsystem,
} from 'app/interfaces/nvme-of.interface';
import { DetailsItemComponent } from 'app/modules/details-table/details-item/details-item.component';
import { DetailsTableComponent } from 'app/modules/details-table/details-table.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EditableComponent } from 'app/modules/forms/editable/editable.component';
import { SidePanelFooterAction } from 'app/modules/slide-ins/form-side-panel/form-side-panel-container.component';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
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
    TranslateModule,
    ReactiveFormsModule,
    TnStepperComponent,
    TnStepComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnCheckboxComponent,
    AddSubsystemHostsComponent,
    AddSubsystemNamespacesComponent,
    AddSubsystemPortsComponent,
    DetailsItemComponent,
    DetailsTableComponent,
    EditableComponent,
  ],
})
export class AddSubsystemComponent extends SidePanelForm<NvmeOfSubsystem> {
  private formBuilder = inject(FormBuilder);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  private nvmeOfService = inject(NvmeOfService);
  private store$ = inject<Store<AppState>>(Store);
  private dialogService = inject(DialogService);
  private destroyRef = inject(DestroyRef);

  protected isLoading = signal(false);

  /** Gates the host-rendered footer Save. */
  readonly requiredRoles = [Role.SharingNvmeTargetWrite];

  private readonly stepper = viewChild(TnStepperComponent);

  protected readonly form = this.formBuilder.group({
    name: ['', Validators.required],
    subnqn: [''],
    namespaces: [[] as NamespaceChanges[]],

    allowAnyHost: [true],
    allowedHosts: [[] as NvmeOfHost[]],

    ports: [[] as NvmeOfPort[]],
  });

  protected readonly helptext = helptextNvmeOf;

  // Drives the stepper's "finished step" pencil icon (replaces mat's [stepControl]).
  protected readonly whatToShareCompleted = stepCompletedSignal(this.form.controls.name);

  private readonly isOnFinalStep = computed(() => {
    const stepper = this.stepper();
    return !!stepper && stepper.selectedIndex() === stepper.steps().length - 1;
  });

  private readonly baseCanSubmit = this.trackCanSubmit(this.isLoading);

  /** Also gated on the final step so the footer Save can't short-circuit the wizard. */
  readonly canSubmit = computed(() => this.baseCanSubmit() && this.isOnFinalStep());

  /** Hides the host footer Save until the final step — Next is the only way forward before that. */
  hideSave(): boolean {
    return !this.isOnFinalStep();
  }

  /**
   * Step-dependent wizard navigation rendered in the `<tn-side-panel>` footer before Save:
   * Next until the final step, Back on it. Re-read each change detection, so the buttons
   * swap as the stepper advances. Labels are extraction markers — the panel container
   * pipes them through `translate`.
   */
  get footerActions(): SidePanelFooterAction[] {
    if (this.isOnFinalStep()) {
      return [{
        label: T('Back'),
        testId: 'back',
        onClick: () => this.stepper()?.previous(),
      }];
    }

    return [{
      label: T('Next'),
      testId: 'next',
      color: 'primary',
      disabled: () => !this.whatToShareCompleted(),
      onClick: () => this.stepper()?.next(),
    }];
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
      this.closeWith(subsystem);
    });
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

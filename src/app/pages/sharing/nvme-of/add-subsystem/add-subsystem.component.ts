import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import {
  MatStep, MatStepLabel, MatStepper, MatStepperNext, MatStepperPrevious,
} from '@angular/material/stepper';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  finalize, forkJoin, map, Observable, switchMap,
  tap,
} from 'rxjs';
import { ServiceName } from 'app/enums/service-name.enum';
import { helptextNvmeOf } from 'app/helptext/sharing/nvme-of/nvme-of';
import {
  CreateNvmeOfNamespace, NvmeOfHost, NvmeOfPort, NvmeOfSubsystem,
} from 'app/interfaces/nvme-of.interface';
import { DetailsItemComponent } from 'app/modules/details-table/details-item/details-item.component';
import { DetailsTableComponent } from 'app/modules/details-table/details-table.component';
import { EditableComponent } from 'app/modules/forms/editable/editable.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import {
  UseIxIconsInStepperComponent,
} from 'app/modules/ix-icon/use-ix-icons-in-stepper/use-ix-icons-in-stepper.component';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
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
import { getNamespaceType } from 'app/pages/sharing/nvme-of/utils/namespace.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { AppState } from 'app/store';
import { checkIfServiceIsEnabled } from 'app/store/services/services.actions';

@UntilDestroy()
@Component({
  selector: 'ix-add-subsystem',
  styleUrls: ['./add-subsystem.component.scss'],
  templateUrl: './add-subsystem.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    TranslateModule,
    MatCard,
    ReactiveFormsModule,
    MatStep,
    MatStepLabel,
    MatStepper,
    UseIxIconsInStepperComponent,
    MatButton,
    MatStepperNext,
    TestDirective,
    IxInputComponent,
    MatStepperPrevious,
    IxCheckboxComponent,
    AddSubsystemHostsComponent,
    AddSubsystemNamespacesComponent,
    AddSubsystemPortsComponent,
    DetailsItemComponent,
    DetailsTableComponent,
    EditableComponent,
  ],
})
export class AddSubsystemComponent {
  protected isLoading = signal(false);

  protected form = this.formBuilder.group({
    name: ['', Validators.required],
    subnqn: [''],
    ana: [false],
    namespaces: [[] as NamespaceChanges[]],

    allowAnyHost: [true],
    allowedHosts: [[] as NvmeOfHost[]],

    ports: [[] as NvmeOfPort[]],
  });

  protected readonly helptext = helptextNvmeOf;

  constructor(
    private formBuilder: FormBuilder,
    public slideInRef: SlideInRef<void, false | NvmeOfSubsystem>,
    private api: ApiService,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private nvmeOfService: NvmeOfService,
    private store$: Store<AppState>,
  ) {}

  protected onSubmit(): void {
    this.isLoading.set(true);
    this.createSubsystem().pipe(
      switchMap((subsystem) => {
        const operations = [
          this.nvmeOfService.associatePorts(subsystem, this.form.value.ports),
          this.nvmeOfService.associateHosts(subsystem, this.form.value.allowedHosts),
        ];

        // Add namespaces if any are configured
        if (this.form.value.namespaces?.length) {
          operations.push(...this.createNamespaces(subsystem, this.form.value.namespaces));
        }

        return forkJoin(operations).pipe(
          map(() => subsystem),
          tap(() => this.store$.dispatch(checkIfServiceIsEnabled({ serviceName: ServiceName.NvmeOf }))),
        );
      }),
      finalize(() => this.isLoading.set(false)),
      this.errorHandler.withErrorHandler(),
      untilDestroyed(this),
    )
      .subscribe((subsystem) => {
        this.snackbar.success(this.translate.instant('New subsystem added'));
        this.slideInRef.close({
          response: subsystem,
          error: null,
        });
      });
  }

  private createSubsystem(): Observable<NvmeOfSubsystem> {
    const values = this.form.value;
    const payload = {
      name: values.name,
      subnqn: values.subnqn || null,
      allow_any_host: values.allowAnyHost,
      ana: values.ana,
    };

    return this.api.call('nvmet.subsys.create', [payload]);
  }

  private createNamespaces(subsystem: NvmeOfSubsystem, namespaces: NamespaceChanges[]): Observable<unknown>[] {
    return namespaces.map((namespace) => {
      const deviceType = getNamespaceType(namespace.device_path);
      const payload: CreateNvmeOfNamespace = {
        subsys_id: subsystem.id,
        device_type: deviceType,
        filesize: namespace.filesize,
        device_path: namespace.device_path,
      };
      return this.api.call('nvmet.namespace.create', [payload]);
    });
  }
}

import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnBannerComponent, TnButtonComponent, TnDialogShellComponent, TnFormFieldComponent, TnInputComponent,
} from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { VmState } from 'app/enums/vm.enum';
import { helptextVmList } from 'app/helptext/vm/vm-list';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-clone-vm-dialog',
  templateUrl: './clone-vm-dialog.component.html',
  styleUrls: ['./clone-vm-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TnBannerComponent,
    TnDialogShellComponent,
    TnFormFieldComponent,
    TnInputComponent,
    ReactiveFormsModule,
    FormActionsComponent,
    TnButtonComponent,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class CloneVmDialogComponent {
  private errorHandler = inject(ErrorHandlerService);
  private api = inject(ApiService);
  private loader = inject(LoaderService);
  vm = inject<VirtualMachine>(DIALOG_DATA);
  protected dialogRef = inject<DialogRef<unknown, CloneVmDialogComponent>>(DialogRef);
  private destroyRef = inject(DestroyRef);

  nameControl = new FormControl('');
  protected readonly requiredRoles = [Role.VmWrite];
  protected readonly helptext = helptextVmList;

  /** A clone copies only on-disk data, so a suspended VM's in-memory state is left behind. */
  protected readonly isSuspended = this.vm.status.state === VmState.Suspended;

  onClone(): void {
    const name = this.nameControl.value;
    this.api.call('vm.clone', name ? [this.vm.id, name] : [this.vm.id])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.dialogRef.close(true);
      });
  }
}

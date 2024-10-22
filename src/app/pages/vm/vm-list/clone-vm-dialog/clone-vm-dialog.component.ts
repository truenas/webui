import { CdkScrollable } from '@angular/cdk/scrolling';
import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose,
} from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { VirtualMachine, VmCloneParams } from 'app/interfaces/virtual-machine.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/services/api.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-clone-vm-dialog',
  templateUrl: './clone-vm-dialog.component.html',
  styleUrls: ['./clone-vm-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    CdkScrollable,
    MatDialogContent,
    IxInputComponent,
    ReactiveFormsModule,
    MatDialogActions,
    FormActionsComponent,
    MatButton,
    TestDirective,
    MatDialogClose,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class CloneVmDialogComponent {
  nameControl = new FormControl('');
  protected readonly requiredRoles = [Role.VmWrite];

  constructor(
    private errorHandler: ErrorHandlerService,
    private ws: ApiService,
    private loader: AppLoaderService,
    @Inject(MAT_DIALOG_DATA) public vm: VirtualMachine,
    private dialogRef: MatDialogRef<CloneVmDialogComponent>,
  ) { }

  onClone(): void {
    const params = [this.vm.id] as VmCloneParams;
    if (this.nameControl.value) {
      params.push(this.nameControl.value);
    }

    this.ws.call('vm.clone', params)
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.dialogRef.close(true);
      });
  }
}

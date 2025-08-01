import { ChangeDetectionStrategy, Component, OnInit, signal, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose,
} from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { take } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { IscsiTarget, IscsiTargetExtent } from 'app/interfaces/iscsi.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { IscsiService } from 'app/services/iscsi.service';

@UntilDestroy()
@Component({
  selector: 'ix-delete-target-dialog',
  templateUrl: './delete-target-dialog.component.html',
  styleUrls: ['./delete-target-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    ReactiveFormsModule,
    IxCheckboxComponent,
    MatDialogActions,
    FormActionsComponent,
    MatButton,
    TestDirective,
    MatDialogClose,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class DeleteTargetDialog implements OnInit {
  private api = inject(ApiService);
  private formBuilder = inject(FormBuilder);
  private dialogRef = inject<MatDialogRef<DeleteTargetDialog>>(MatDialogRef);
  private errorHandler = inject(ErrorHandlerService);
  private loader = inject(LoaderService);
  private iscsiService = inject(IscsiService);
  private translate = inject(TranslateService);
  target = inject<IscsiTarget>(MAT_DIALOG_DATA);

  protected readonly requiredRoles = [Role.SharingIscsiTargetWrite];

  readonly targetExtents = signal<IscsiTargetExtent[]>([]);
  protected warningMessage = signal<string>('');

  form = this.formBuilder.group({
    delete_extents: [false],
    force: [false],
  });

  ngOnInit(): void {
    this.getTargetExtents();

    this.iscsiService.getGlobalSessions().pipe(untilDestroyed(this)).subscribe(
      (sessions) => {
        sessions.forEach((session) => {
          if (Number(session.target.split(':')[1]) === this.target.id) {
            this.warningMessage.set(`<font color="orange">${
              this.translate.instant('Warning: iSCSI Target is currently in use.')
            }</font><br>`);
          }
        });
      },
    );
  }

  onDelete(): void {
    this.api.call('iscsi.target.delete', [this.target.id, this.form.value.force, this.form.value.delete_extents])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.dialogRef.close(true);
      });
  }

  private getTargetExtents(): void {
    this.iscsiService.getTargetExtents().pipe(
      take(1),
      untilDestroyed(this),
    ).subscribe((extents) => {
      this.targetExtents.set(extents.filter((extent) => extent.target === this.target.id));
    });
  }
}

import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
  signal,
} from '@angular/core';
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
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IscsiService } from 'app/services/iscsi.service';

@UntilDestroy()
@Component({
  selector: 'ix-delete-target-dialog',
  templateUrl: './delete-target-dialog.component.html',
  styleUrls: ['./delete-target-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
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
export class DeleteTargetDialogComponent implements OnInit {
  protected readonly requiredRoles = [Role.SharingIscsiTargetWrite];

  readonly targetExtents = signal<IscsiTargetExtent[]>([]);
  protected warningMessage = signal<string>('');

  form = this.formBuilder.group({
    delete_extents: [false],
    force: [false],
  });

  constructor(
    private api: ApiService,
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<DeleteTargetDialogComponent>,
    private errorHandler: ErrorHandlerService,
    private loader: AppLoaderService,
    private iscsiService: IscsiService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public target: IscsiTarget,
  ) { }

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
        this.errorHandler.catchError(),
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
      this.cdr.markForCheck();
    });
  }
}

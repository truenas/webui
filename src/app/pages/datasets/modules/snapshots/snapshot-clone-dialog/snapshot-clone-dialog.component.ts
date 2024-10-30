import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAnchor, MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogClose, MatDialogTitle } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextSnapshots } from 'app/helptext/storage/snapshots/snapshots';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-snapshot-clone-dialog',
  templateUrl: './snapshot-clone-dialog.component.html',
  styleUrls: ['./snapshot-clone-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    TranslateModule,
    ReactiveFormsModule,
    IxInputComponent,
    FormActionsComponent,
    MatButton,
    RequiresRolesDirective,
    TestDirective,
    MatDialogClose,
    RouterLink,
    MatAnchor,
  ],
})
export class SnapshotCloneDialogComponent implements OnInit {
  readonly requiredRoles = [Role.SnapshotWrite];

  wasDatasetCloned = false;

  form = this.fb.group({
    dataset_dst: ['', Validators.required],
  });

  readonly tooltips = {
    dataset_dst: helptextSnapshots.snapshot_clone_name_tooltip,
  };

  constructor(
    private ws: WebSocketService,
    private loader: AppLoaderService,
    private fb: FormBuilder,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) private snapshotName: string,
  ) {}

  get datasetName(): string {
    return this.form.value.dataset_dst;
  }

  ngOnInit(): void {
    this.setDatasetName();
  }

  onSubmit(): void {
    this.ws.call('zfs.snapshot.clone', [{
      snapshot: this.snapshotName,
      dataset_dst: this.datasetName,
    }])
      .pipe(this.loader.withLoader(), untilDestroyed(this))
      .subscribe({
        next: () => {
          this.wasDatasetCloned = true;
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          this.errorHandler.handleWsFormError(error, this.form);
        },
      });
  }

  private setDatasetName(): void {
    let suggestedName: string;
    if (this.snapshotName.includes('/')) {
      suggestedName = this.snapshotName.replace('@', '-') + '-clone';
    } else {
      suggestedName = this.snapshotName.replace('@', '/') + '-clone';
    }

    this.form.setValue({ dataset_dst: suggestedName });
  }
}

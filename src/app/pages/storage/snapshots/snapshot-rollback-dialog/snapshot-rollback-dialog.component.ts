import {
  Component, ChangeDetectionStrategy, Inject, ChangeDetectorRef,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { untilDestroyed } from '@ngneat/until-destroy';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RollbackRecursiveType } from 'app/enums/rollback-recursive-type.enum';
import helptext from 'app/helptext/storage/snapshots/snapshots';
import { ZfsRollbackParams, ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { AppLoaderService, WebSocketService } from 'app/services';

@Component({
  selector: 'app-snapshot-rollback-dialog',
  templateUrl: './snapshot-rollback-dialog.component.html',
  styleUrls: ['./snapshot-rollback-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SnapshotRollbackDialogComponent {
  wasDatasetRolledBack = false;
  form = this.fb.group({
    recursive: ['' as RollbackRecursiveType],
    force: [false, [Validators.requiredTrue]],
  });
  params: {
    snapshot: string;
    dataset: string;
    datetime: number;
  };

  readonly recursive = {
    fcName: 'recursive',
    tooltip: helptext.rollback_recursive_radio_tooltip,
    label: helptext.rollback_recursive_radio_placeholder,
    options: of([
      {
        value: '',
        label: helptext.rollback_dataset_placeholder,
        tooltip: helptext.rollback_dataset_tooltip,
      },
      {
        value: RollbackRecursiveType.Recursive,
        label: helptext.rollback_recursive_placeholder,
        tooltip: helptext.rollback_recursive_tooltip,
      },
      {
        value: RollbackRecursiveType.RecursiveClones,
        label: helptext.rollback_recursive_clones_placeholder,
        tooltip: helptext.rollback_recursive_clones_tooltip,
      },
    ]),
  };

  readonly force = {
    fcName: 'force',
    label: helptext.rollback_confirm,
    required: true,
  };

  constructor(
    private ws: WebSocketService,
    private loader: AppLoaderService,
    private fb: FormBuilder,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) private snapshot: ZfsSnapshot,
  ) {
    this.params = {
      snapshot: snapshot.snapshot_name,
      dataset: snapshot.dataset,
      datetime: snapshot.properties.creation.parsed.$date,
    };
  }

  onSubmit(): void {
    const body: ZfsRollbackParams[1] = {
      force: true,
    };
    if (this.form.value.recursive) {
      body.recursive = true;
    }

    this.ws.call('zfs.snapshot.rollback', [this.snapshot.name, body]).pipe(
      tap(() => this.loader.open()),
      untilDestroyed(this),
    ).subscribe(() => {
      this.loader.close();
      this.wasDatasetRolledBack = true;
      this.cdr.markForCheck();
    }, (error) => {
      this.loader.close();
      this.errorHandler.handleWsFormError(error, this.form);
    });
  }
}

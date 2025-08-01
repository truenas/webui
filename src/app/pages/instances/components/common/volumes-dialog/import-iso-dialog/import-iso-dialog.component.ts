import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle,
} from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { VirtualizationGlobalConfig } from 'app/interfaces/virtualization.interface';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { FilesystemService } from 'app/services/filesystem.service';

@UntilDestroy()
@Component({
  selector: 'ix-import-iso-dialog',
  templateUrl: './import-iso-dialog.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogContent,
    IxExplorerComponent,
    TranslateModule,
    MatDialogTitle,
    ReactiveFormsModule,
    MatButton,
    IxInputComponent,
    IxSelectComponent,
    MatDialogActions,
    MatDialogClose,
    TestDirective,
  ],
})
export class IxImportIsoDialogComponent implements OnInit {
  private fileSystem = inject(FilesystemService);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private matDialogRef = inject<MatDialogRef<IxImportIsoDialogComponent>>(MatDialogRef);
  private validatorsService = inject(IxValidatorsService);
  private fb = inject(FormBuilder);
  private loader = inject(LoaderService);
  private options = inject<{
    config: VirtualizationGlobalConfig;
  }>(MAT_DIALOG_DATA);

  protected form = this.fb.group({
    iso_location: ['', [
      Validators.required,
      this.validatorsService.withMessage(
        Validators.pattern('.*\\.iso$'),
        this.translate.instant('Must select an ISO file'),
      ),
    ]],
    name: ['', Validators.required],
    storage_pool: ['', Validators.required],
  });

  protected poolOptions$ = of(this.options.config.storage_pools.map((pool) => ({ label: pool, value: pool })));

  protected readonly treeNodeProvider = this.fileSystem.getFilesystemNodeProvider({
    datasetsOnly: true,
    directoriesOnly: false,
    showHiddenFiles: true,
  });

  protected submit(): void {
    this.loader.open();
    this.api.call('virt.volume.import_iso', [{
      name: this.form.value.name,
      iso_location: this.form.value.iso_location,
      storage_pool: this.form.value.storage_pool,
    }]).pipe(
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.loader.close();
        this.matDialogRef.close(true);
      },
    });
  }

  ngOnInit(): void {
    this.setStoragePoolDefaultValue();
    this.updateNameFromIsoSelection();
  }

  private setStoragePoolDefaultValue(): void {
    this.form.controls.storage_pool.setValue(this.options.config.pool);
  }

  private updateNameFromIsoSelection(): void {
    this.form.controls.iso_location.valueChanges.pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (isoLocation) => {
        if (this.form.controls.iso_location.valid) {
          const isoName = isoLocation.split('/').findLast((dir) => dir.endsWith('.iso'));
          this.form.controls.name.setValue(isoName.replace('.iso', ''));
        }
      },
    });
  }
}

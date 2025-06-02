import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialogClose, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { datasetsRootNode, zvolsRootNode } from 'app/constants/basic-root-nodes.constant';
import { NvmeOfNamespaceType } from 'app/enums/nvme-of.enum';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { NewNamespace } from 'app/pages/sharing/nvme-of/namespaces/namespace-dialog/new-namespace.interface';
import { getNamespaceType } from 'app/pages/sharing/nvme-of/utils/namespace.utils';
import { FilesystemService } from 'app/services/filesystem.service';

@Component({
  selector: 'ix-namespace-dialog',
  templateUrl: './namespace-dialog.component.html',
  styleUrl: './namespace-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxExplorerComponent,
    ReactiveFormsModule,
    TranslateModule,
    MatDialogTitle,
    MatButton,
    MatDialogClose,
    TestDirective,
    FormActionsComponent,
  ],
})
export class NamespaceDialogComponent {
  protected readonly treeNodeProvider = this.filesystemService.getFilesystemNodeProvider({
    datasetsAndZvols: true,
  });

  protected readonly rootNodes = [datasetsRootNode, zvolsRootNode];

  protected form = this.formBuilder.group({
    namespacePath: ['', [Validators.required]],
  });

  constructor(
    private formBuilder: NonNullableFormBuilder,
    private filesystemService: FilesystemService,
    private dialogRef: MatDialogRef<NamespaceDialogComponent, NewNamespace>,
  ) {}

  protected onSubmit(): void {
    const path = this.form.value.namespacePath;
    const type = getNamespaceType(path);
    const fixedPath = type === NvmeOfNamespaceType.Zvol
      ? path.replace('/dev/zvol/', 'zvol/')
      : path;

    this.dialogRef.close({
      device_path: fixedPath,
      device_type: type,
    });
  }
}

import {
  ChangeDetectionStrategy, Component, input, OnInit,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter, map, switchMap } from 'rxjs/operators';
import { DirectoryServiceState } from 'app/enums/directory-service-state.enum';
import { Role } from 'app/enums/role.enum';
import { helptextAcl } from 'app/helptext/storage/volumes/datasets/dataset-acl';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { DatasetAclEditorStore } from 'app/pages/datasets/modules/permissions/stores/dataset-acl-editor.store';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-acl-editor-save-controls',
  templateUrl: './acl-editor-save-controls.component.html',
  styleUrls: ['./acl-editor-save-controls.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AclEditorSaveControlsComponent implements OnInit {
  readonly canBeSaved = input(false);
  readonly ownerValues = input.required<{
    owner: string;
    ownerGroup: string;
    applyOwner: boolean;
    applyGroup: boolean;
  }>();

  protected saveParameters = this.formBuilder.group({
    recursive: [false],
    traverse: [false],
    validate_effective_acl: [true],
  });

  protected readonly helptext = helptextAcl;
  protected readonly Role = Role;

  constructor(
    private formBuilder: FormBuilder,
    private store: DatasetAclEditorStore,
    private dialogService: DialogService,
    private ws: WebSocketService,
  ) {}

  ngOnInit(): void {
    this.setRecursiveCheckboxWarning();
  }

  // TODO: Move here and in other places to global store.
  protected hasValidateAclCheckbox = toSignal(this.ws.call('directoryservices.get_state').pipe(
    map((state) => {
      return state.activedirectory !== DirectoryServiceState.Disabled
      || state.ldap !== DirectoryServiceState.Disabled;
    }),
  ));

  protected onSavePressed(): void {
    const saveParameters = this.saveParameters.value;

    this.store.saveAcl({
      recursive: saveParameters.recursive,
      traverse: saveParameters.recursive && saveParameters.traverse,
      validateEffectiveAcl: saveParameters.validate_effective_acl,
      owner: this.ownerValues().owner,
      ownerGroup: this.ownerValues().ownerGroup,
      applyOwner: this.ownerValues().applyOwner,
      applyGroup: this.ownerValues().applyGroup,
    });
  }

  private setRecursiveCheckboxWarning(): void {
    this.saveParameters.get('recursive').valueChanges.pipe(
      filter(Boolean),
      switchMap(() => {
        return this.dialogService.confirm({
          title: helptextAcl.dataset_acl_recursive_dialog_warning,
          message: helptextAcl.dataset_acl_recursive_dialog_warning_message,
        });
      }),
      untilDestroyed(this),
    ).subscribe((confirmed) => {
      if (confirmed) {
        return;
      }

      this.saveParameters.patchValue({ recursive: false });
    });
  }
}

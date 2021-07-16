import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter } from 'rxjs/operators';
import { AclType } from 'app/enums/acl-type.enum';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-acl';
import { Acl } from 'app/interfaces/acl.interface';
import { FileSystemStat } from 'app/interfaces/filesystem-stat.interface';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { DatasetAclEditorStore } from 'app/pages/storage/volumes/permissions/stores/dataset-acl-editor.store';
import { DialogService } from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: 'dataset-acl-editor.component.html',
  styleUrls: ['./dataset-acl-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetAclEditorComponent implements OnInit {
  datasetPath: string;
  isLoading: boolean;
  acl: Acl;
  selectedAceIndex: number;
  acesWithError: number[];
  stat: FileSystemStat;

  saveParameters = new FormGroup({
    recursive: new FormControl(),
    traverse: new FormControl(),
  });

  readonly recursiveFieldConfig: FieldConfig = {
    type: 'checkbox',
    name: 'recursive',
    placeholder: helptext.dataset_acl_recursive_placeholder,
    tooltip: helptext.dataset_acl_recursive_tooltip,
    value: false,
  };
  readonly traverseFieldConfig: FieldConfig = {
    type: 'checkbox',
    name: 'traverse',
    placeholder: helptext.dataset_acl_traverse_placeholder,
    tooltip: helptext.dataset_acl_traverse_tooltip,
    value: false,
  };

  get isNfsAcl(): boolean {
    return this.acl.acltype === AclType.Nfs4;
  }

  constructor(
    private store: DatasetAclEditorStore,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
  ) {}

  ngOnInit(): void {
    this.datasetPath = '/mnt/' + this.route.snapshot.params['path'];
    this.store.loadAcl(this.datasetPath);

    this.store.state$
      .pipe(untilDestroyed(this))
      .subscribe((state) => {
        this.isLoading = state.isLoading;
        this.acl = state.acl;
        this.selectedAceIndex = state.selectedAceIndex;
        this.acesWithError = state.acesWithError;
        this.stat = state.stat;

        this.cdr.markForCheck();
      });

    this.saveParameters.get('recursive').valueChanges.pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => {
      this.dialogService.confirm({
        title: helptext.dataset_acl_recursive_dialog_warning,
        message: helptext.dataset_acl_recursive_dialog_warning_message,
      }).pipe(untilDestroyed(this)).subscribe((confirmed) => {
        if (confirmed) {
          return;
        }

        this.saveParameters.patchValue({ recursive: false });
      });
    });
  }

  onAddItemPressed(): void {
    this.store.addAce();
  }

  onStripAclPressed(): void {
    this.store.stripAcl();
  }

  onSavePressed(): void {
    this.store.saveAcl({
      recursive: this.recursiveFieldConfig.value,
      traverse: this.recursiveFieldConfig.value && this.traverseFieldConfig.value,
    });
  }
}

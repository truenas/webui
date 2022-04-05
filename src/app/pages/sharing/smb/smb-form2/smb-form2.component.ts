import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { combineLatest, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Option } from 'app/interfaces/option.interface';
import { SmbPresets, SmbShare } from 'app/interfaces/smb-share.interface';
import { forbiddenValues } from 'app/modules/entity/entity-form/validators/forbidden-values-validation';
import { ModalService, WebSocketService } from 'app/services';
import { FilesystemService } from 'app/services/filesystem.service';

@UntilDestroy()
@Component({
  selector: 'smb-form',
  templateUrl: './smb-form2.component.html',
  styleUrls: ['./smb-form2.component.scss'],
})
export class SmbForm2Component implements OnInit {
  isLoading = false;
  isAdvancedMode = false;
  namesInUse: string[] = [];
  existingSmbShare: SmbShare;

  get isNew(): boolean {
    return !this.existingSmbShare;
  }

  readonly treeNodeProvider = this.filesystemService.getFilesystemNodeProvider({ directoriesOnly: true });

  presets: SmbPresets;
  protected presetFields: (keyof SmbShare)[] = [];

  options: { [key: string]: Observable<Option[]> } = {
    purpose$: this.ws.call('sharing.smb.presets').pipe(
      map((presets) => {
        this.presets = presets;
        const options: Option[] = [];
        for (const presetName in presets) {
          options.push({ label: presets[presetName].verbose_name, value: presetName });
        }
        return options;
      }),
      tap(() => {
        if (this.isNew) {
          this.form.get('purpose').setValue('DEFAULT_SHARE');
        }
      }),
    ),
  };

  form = this.formBuilder.group({
    path: ['', Validators.required],
    name: ['', [forbiddenValues(this.namesInUse), Validators.required]],
    purpose: [''],
    comment: [''],
    enabled: [true],
    acl: [false],
    ro: [false],
    browsable: [false],
    guestok: [false],
    abe: [false],
    hostsallow: [[] as string[]],
    hostsdeny: [[] as string[]],
    home: [false],
    timemachine: [false],
    afp: [false],
    shadowcopy: [false],
    recyclebin: [false],
    aapl_name_mangling: [false],
    streams: [false],
    durablehandle: [false],
    fsrvp: [false],
    path_suffix: [''],
    auxsmbconf: [''],
  });

  constructor(
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private modalService: ModalService,
    private filesystemService: FilesystemService,
  ) {
    combineLatest([
      this.ws.call('sharing.smb.query', []),
      this.modalService.getRow$,
    ]).pipe(
      map(([shares, pk]) => shares.filter((share) => share.id !== pk).map((share) => share.name)),
      untilDestroyed(this),
    ).subscribe((shareNames) => {
      ['global', ...shareNames].forEach((name) => this.namesInUse.push(name));
    });
  }

  ngOnInit(): void {
    this.form.get('purpose').valueChanges.pipe(untilDestroyed(this)).subscribe(
      (value: string) => {
        this.clearPresets();
        for (const param in this.presets[value].params) {
          this.presetFields.push(param as keyof SmbShare);
          const ctrl = this.form.get(param);
          if (ctrl && param !== 'auxsmbconf') {
            ctrl.setValue(this.presets[value].params[param as keyof SmbShare]);
            ctrl.disable();
          }
        }
      },
    );
  }

  clearPresets(): void {
    for (const item of this.presetFields) {
      this.form.get(item).enable();
    }
    this.presetFields = [];
  }

  setSmbShareForEdit(smbShare: SmbShare): void {
    this.existingSmbShare = smbShare;
    this.form.patchValue(smbShare);
  }

  /* If user blurs name field with empty value, try to auto-populate based on path */
  blurEventName(): void {
    const pathControl = this.form.get('path');
    const nameControl = this.form.get('name');
    if (pathControl.value && !nameControl.value) {
      nameControl.setValue(pathControl.value.split('/').pop());
    }
  }
}

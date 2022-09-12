import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { RsyncModuleMode } from 'app/enums/rsync-mode.enum';
import helptext from 'app/helptext/services/components/service-rsync';
import { RsyncModule, RsyncModuleCreate } from 'app/interfaces/rsync-module.interface';
import { GroupComboboxProvider } from 'app/modules/ix-forms/classes/group-combobox-provider';
import { UserComboboxProvider } from 'app/modules/ix-forms/classes/user-combobox-provider';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { UserService, WebSocketService } from 'app/services';
import { FilesystemService } from 'app/services/filesystem.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './rsync-module-form.component.html',
  styleUrls: ['./rsync-module-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RsyncModuleFormComponent {
  get isNew(): boolean {
    return !this.editingModule;
  }

  get title(): string {
    return this.isNew
      ? this.translate.instant('Add Rsync Module')
      : this.translate.instant('Edit Rsync Module');
  }

  form = this.formBuilder.group({
    name: ['', Validators.required],
    path: ['', Validators.required],
    comment: [''],
    enabled: [false],
    mode: [RsyncModuleMode.ReadOnly],
    maxconn: [0, Validators.min(0)],
    user: [''],
    group: [''],
    hostsallow: [[] as string[]],
    hostsdeny: [[] as string[]],
    auxiliary: [''],
  });

  isLoading = false;
  editingModule: RsyncModule;
  modeOptions$ = of(helptext.rsyncmod_mode_options);

  readonly userProvider = new UserComboboxProvider(this.userService);
  readonly groupProvider = new GroupComboboxProvider(this.userService);
  readonly treeNodeProvider = this.filesystemService.getFilesystemNodeProvider({ directoriesOnly: true });

  readonly tooltips = {
    name: helptext.rsyncmod_name_tooltip,
    path: helptext.rsyncmod_path_tooltip,
    comment: helptext.rsyncmod_comment_tooltip,
    enabled: helptext.rsyncmod_enabled_tooltip,
    mode: helptext.rsyncmod_mode_tooltip,
    maxconn: helptext.rsyncmod_maxconn_tooltip,
    user: helptext.rsyncmod_user_tooltip,
    group: helptext.rsyncmod_group_tooltip,
    hostsallow: helptext.rsyncmod_hostsallow_tooltip,
    hostsdeny: helptext.rsyncmod_hostsdeny_tooltip,
    auxiliary: helptext.rsyncd_auxiliary_tooltip,
  };

  constructor(
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private errorHandler: FormErrorHandlerService,
    private translate: TranslateService,
    private slideInService: IxSlideInService,
    private filesystemService: FilesystemService,
    private userService: UserService,
  ) {}

  setModuleForEdit(module: RsyncModule): void {
    this.editingModule = module;
    this.form.patchValue(module);
  }

  onSubmit(): void {
    const values = this.form.value;

    this.isLoading = true;
    let request$: Observable<unknown>;
    if (this.isNew) {
      request$ = this.ws.call('rsyncmod.create', [values as RsyncModuleCreate]);
    } else {
      request$ = this.ws.call('rsyncmod.update', [
        this.editingModule.id,
        values as RsyncModuleCreate,
      ]);
    }

    request$.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isLoading = false;
        this.slideInService.close();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }
}

import {
  ChangeDetectionStrategy, Component, OnInit, signal, computed, inject,
} from '@angular/core';
import { ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { FileType } from 'app/enums/file-type.enum';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { helptextSharingWebshare } from 'app/helptext/sharing/webshare/webshare';
import { TreeNode, ExplorerNodeData } from 'app/interfaces/tree-node.interface';
import { WebShareConfig } from 'app/interfaces/webshare-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebShareValidatorService } from 'app/pages/sharing/webshare/webshare-validator.service';
import { AppState } from 'app/store';
import { checkIfServiceIsEnabled } from 'app/store/services/services.actions';

export interface WebShareFormData {
  name: string;
  path: string;
  search_indexed?: boolean;
  is_home_base?: boolean;
  home_directory_template?: string;
  isNew: boolean;
}

@UntilDestroy()
@Component({
  selector: 'ix-webshare-shares-form',
  templateUrl: './webshare-shares-form.component.html',
  styleUrls: ['./webshare-shares-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxSelectComponent,
    IxExplorerComponent,
    IxCheckboxComponent,
    IxIconComponent,
    FormActionsComponent,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
  providers: [WebShareValidatorService, FormBuilder],
})
export class WebShareSharesFormComponent implements OnInit {
  protected readonly requiredRoles = [Role.SharingWrite];
  protected readonly helptext = helptextSharingWebshare;

  protected isFormLoading = signal(true);
  protected webShareConfig = signal<WebShareConfig | null>(null);

  private api = inject(ApiService);
  private formErrorHandler = inject(FormErrorHandlerService);
  private fb = inject(FormBuilder);
  private snackbar = inject(SnackbarService);
  private dialog = inject(DialogService);
  private validatorService = inject(WebShareValidatorService);
  private translate = inject(TranslateService);
  slideInRef = inject(SlideInRef<WebShareFormData, boolean>);
  private store$ = inject(Store<AppState>);

  protected hasExistingHomeBase = computed(() => {
    const config = this.webShareConfig();
    if (!config?.shares) return false;

    // Check if there's already a home base share (excluding the current one if editing)
    const currentName = this.isNew ? null : this.slideInRef.getData()?.name;
    return config.shares.some((share) => share.is_home_base && share.name !== currentName);
  });

  form = this.fb.group({
    name: ['', [
      Validators.required,
      Validators.pattern(/^[a-zA-Z0-9_-]+$/),
    ]],
    path: ['', Validators.required],
    search_indexed: [true],
    is_home_base: [false],
    home_directory_template: ['{{.Username}}'],
  });

  readonly homeDirectoryTemplateOptions$ = of([
    { label: '{USERNAME}', value: '{{.Username}}' },
    { label: '{USERNAME}_{UID}', value: '{{.Username}}_{{.UID}}' },
  ]);

  get isNew(): boolean {
    return this.slideInRef.getData()?.isNew || false;
  }

  get title(): string {
    return this.isNew
      ? this.helptext.webshare_form_title_add
      : this.helptext.webshare_form_title_edit;
  }

  protected readonly treeNodeProvider = (parent: TreeNode<ExplorerNodeData>): Observable<ExplorerNodeData[]> => {
    const path = parent ? parent.data.path : '/mnt';
    return this.api.call('filesystem.listdir', [path, [], {
      order_by: ['name'],
    }]).pipe(
      map((nodes) => nodes
        .filter((node) => node.type === FileType.Directory)
        .map((node) => {
          let nodeType: ExplorerNodeType;
          switch (node.type) {
            case FileType.Directory:
              nodeType = ExplorerNodeType.Directory;
              break;
            case FileType.Symlink:
              nodeType = ExplorerNodeType.Symlink;
              break;
            default:
              nodeType = ExplorerNodeType.File;
              break;
          }

          return {
            path: node.path,
            name: node.name,
            type: nodeType,
            hasChildren: true,
          } as ExplorerNodeData;
        })),
    );
  };


  ngOnInit(): void {
    this.loadWebShareConfig();
    this.setupValidators();
    this.setupPathAutoPopulate();

    const data = this.slideInRef.getData();
    if (data) {
      if (!data.isNew && data.name) {
        // Editing existing WebShare
        this.form.patchValue({
          name: data.name,
          path: data.path,
          search_indexed: data.search_indexed ?? true,
          is_home_base: data.is_home_base ?? false,
          home_directory_template: data.home_directory_template ?? '{{.Username}}',
        });

        // Disable name field when editing
        this.form.controls.name.disable();
      } else if (data.isNew && (data.name || data.path)) {
        // Creating new WebShare with pre-filled values
        this.form.patchValue({
          name: data.name || '',
          path: data.path || '',
          search_indexed: data.search_indexed ?? true,
        });
      }
    }
  }

  onSubmit(): void {
    if (!this.webShareConfig()) {
      return;
    }

    const values = this.form.getRawValue();
    const config = this.webShareConfig();
    const updatedShares = [...(config.shares || [])];

    if (this.isNew) {
      // Add new share
      updatedShares.push({
        name: values.name,
        path: values.path,
        search_indexed: Boolean(values.search_indexed),
        is_home_base: Boolean(values.is_home_base),
      });
    } else {
      // Edit existing share
      const originalName = this.slideInRef.getData()?.name;
      const shareIndex = updatedShares.findIndex(
        (share) => share.name === originalName,
      );

      if (shareIndex !== -1) {
        updatedShares[shareIndex] = {
          name: values.name,
          path: values.path,
          search_indexed: Boolean(values.search_indexed),
          is_home_base: Boolean(values.is_home_base),
        };
      }
    }

    this.isFormLoading.set(true);
    this.api.call('webshare.update', [{
      shares: updatedShares,
      home_directory_template: values.home_directory_template || '{{.Username}}',
    }])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.snackbar.success(
            this.isNew
              ? this.translate.instant('WebShare added successfully')
              : this.translate.instant('WebShare updated successfully'),
          );

          // Check if the WebShare service is enabled when adding a new share
          if (this.isNew) {
            this.store$.dispatch(checkIfServiceIsEnabled({ serviceName: ServiceName.WebShare }));
          }

          this.slideInRef.close({ response: true, error: null });
        },
        error: (error: unknown) => {
          this.isFormLoading.set(false);
          this.formErrorHandler.handleValidationErrors(error, this.form);
        },
      });
  }

  private loadWebShareConfig(): void {
    this.api.call('webshare.config')
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (config) => {
          this.webShareConfig.set(config);
          this.updateHomeBaseControl();
          this.isFormLoading.set(false);
        },
        error: () => {
          this.isFormLoading.set(false);
          this.dialog.error({
            title: this.translate.instant('Error'),
            message: this.translate.instant('Failed to load WebShare configuration'),
          });
          this.slideInRef.close({ response: false, error: null });
        },
      });
  }

  private updateHomeBaseControl(): void {
    if (this.isNew && this.hasExistingHomeBase()) {
      const homeBaseControl = this.form.controls.is_home_base as FormControl;
      homeBaseControl.setValue(false);
      homeBaseControl.disable();
    }
  }

  private setupValidators(): void {
    const nameControl = this.form.controls.name as FormControl;

    if (this.isNew) {
      nameControl.addAsyncValidators(
        this.validatorService.validateWebShareName(this.webShareConfig),
      );
    }

    const pathControl = this.form.controls.path as FormControl;
    pathControl.addValidators(
      this.validatorService.validateWebSharePath(),
    );
    pathControl.addAsyncValidators(
      this.validatorService.validateWebSharePathNesting(
        this.webShareConfig,
        this.isNew ? null : (this.slideInRef.getData()?.name as string),
      ),
    );

    // Add validation for is_home_base checkbox
    const isHomeBaseControl = this.form.controls.is_home_base as FormControl;
    isHomeBaseControl.addAsyncValidators(
      this.validatorService.validateHomeBase(
        this.webShareConfig,
        this.isNew ? null : (this.slideInRef.getData()?.name as string),
      ),
    );
  }

  private setupPathAutoPopulate(): void {
    // Only auto-populate for new WebShares
    if (!this.isNew) {
      return;
    }

    // Track if the name was pre-filled
    const initialName = this.form.controls.name.value;

    this.form.controls.path.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((path: string) => {
        // Only auto-populate if name field is empty and wasn't pre-filled
        if (!this.form.controls.name.value && !initialName && path) {
          // Extract the last directory name from the path
          const pathParts = path.split('/').filter((part) => part);
          if (pathParts.length > 0) {
            const lastDirectoryName = pathParts[pathParts.length - 1];
            // Set the name field with the last directory name
            this.form.controls.name.setValue(lastDirectoryName);
          }
        }
      });
  }
}

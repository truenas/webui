import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, signal, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCellDefDirective, TnDialogShellComponent, TnFormFieldComponent,
  TnFormSectionComponent, TnHeaderCellDefDirective, TnInputComponent, TnSelectComponent,
  TnTableColumnDirective, TnTableComponent, TnTestIdDirective,
} from '@truenas/ui-components';
import { catchError, Observable, of } from 'rxjs';
import { ContainerRemote, ContainerType } from 'app/enums/container.enum';
import { ContainerImage, ContainerImageRegistryResponse } from 'app/interfaces/container.interface';
import { Option } from 'app/interfaces/option.interface';
import { ignoreTranslation } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

export type ContainerImageWithId = ContainerImage & {
  id: string;
};

@Component({
  selector: 'ix-select-image-dialog',
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    TnButtonComponent,
    TnCellDefDirective,
    TnDialogShellComponent,
    TnFormFieldComponent,
    TnFormSectionComponent,
    TnHeaderCellDefDirective,
    TnInputComponent,
    TnSelectComponent,
    TnTableColumnDirective,
    TnTableComponent,
    TnTestIdDirective,
    TranslateModule,
  ],
  templateUrl: './select-image-dialog.component.html',
  styleUrls: ['./select-image-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectImageDialog implements OnInit {
  private api = inject(ApiService);
  private dialogRef = inject<DialogRef<unknown, SelectImageDialog>>(DialogRef);
  private fb = inject(FormBuilder);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  private destroyRef = inject(DestroyRef);
  protected data = inject<{
    remote: ContainerRemote;
    type: ContainerType;
  }>(DIALOG_DATA);

  protected readonly columns = ['label', 'os', 'release', 'archs', 'variant', 'actions'];
  protected filterForm = this.fb.group({
    os: [''],
    variant: [''],
    release: [''],
    searchQuery: [''],
  });

  protected osOptions$: Observable<Option[]>;
  protected variantOptions$: Observable<Option[]>;
  protected releaseOptions$: Observable<Option[]>;

  protected images = signal<ContainerImageWithId[]>([]);
  protected filteredImages = signal<ContainerImageWithId[]>([]);
  protected isLoading = signal(true);
  protected emptyMessage = signal('');

  constructor() {
    this.filterForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.filterImages());
  }

  ngOnInit(): void {
    this.getImages();
  }

  protected selectImage(image: ContainerImageWithId): void {
    this.dialogRef.close(image);
  }

  private getImages(): void {
    this.api.call('container.image.query_registry', [])
      .pipe(
        catchError((error: unknown) => {
          this.errorHandler.showErrorModal(error);
          this.emptyMessage.set(this.translate.instant('Failed to load images'));
          this.isLoading.set(false);
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((registryImages: ContainerImageRegistryResponse[]) => {
        this.setFilteringOptions(registryImages);
        this.filterImages();
        this.isLoading.set(false);
      });
  }

  private setFilteringOptions(registryImages: ContainerImageRegistryResponse[]): void {
    const osSet = new Set<string>();
    const variantSet = new Set<string>();
    const releaseSet = new Set<string>();

    const imageArray: ContainerImageWithId[] = [];

    registryImages.forEach((registryImage) => {
      registryImage.versions.forEach((version: unknown) => {
        let versionString: string;
        let archsArray: string[] = ['amd64'];
        let variantString = 'default';

        if (typeof version === 'string') {
          versionString = version;
        } else if (version && typeof version === 'object') {
          const versionObj = version as Record<string, unknown>;
          versionString = (versionObj.version as string)
            || (versionObj.name as string)
            || (versionObj.tag as string)
            || JSON.stringify(version);
          archsArray = (versionObj.archs as string[]) || (versionObj.architectures as string[]) || ['amd64'];
          variantString = (versionObj.variant as string) || 'default';
        } else {
          versionString = String(version);
        }

        const imageId = `${registryImage.name}:${versionString}`;

        const image: ContainerImageWithId = {
          id: imageId,
          archs: archsArray,
          description: `${registryImage.name} container image`,
          label: registryImage.name,
          os: this.extractOs(registryImage.name),
          release: versionString,
          variant: variantString,
          instance_types: [ContainerType.Container],
          secureboot: null,
        };

        imageArray.push(image);
        osSet.add(image.os);
        variantSet.add(image.variant);
        releaseSet.add(image.release);
      });
    });

    this.images.set(imageArray);

    this.osOptions$ = of([...osSet].map((os) => ({ label: ignoreTranslation(os), value: os })));
    this.variantOptions$ = of([...variantSet].map((variant) => ({
      label: ignoreTranslation(variant),
      value: variant,
    })));

    this.releaseOptions$ = of([...releaseSet].map((release) => ({
      label: ignoreTranslation(release),
      value: release,
    })));
  }

  private extractOs(imageName: string): string {
    const lowerName = imageName.toLowerCase();

    if (lowerName.includes('ubuntu')) return 'Ubuntu';
    if (lowerName.includes('debian')) return 'Debian';
    if (lowerName.includes('alpine')) return 'Alpine';
    if (lowerName.includes('centos')) return 'CentOS';
    if (lowerName.includes('fedora')) return 'Fedora';
    if (lowerName.includes('nginx')) return 'Linux';
    if (lowerName.includes('node')) return 'Linux';
    if (lowerName.includes('python')) return 'Linux';

    return 'Linux';
  }

  private filterImages(): void {
    const {
      os, variant, release, searchQuery,
    } = this.filterForm.value;

    const filtered = this.images().filter((image) => {
      const matchesOs = os ? image.os === os : true;
      const matchesVariant = variant ? image.variant === variant : true;
      const matchesRelease = release ? image.release === release : true;
      const matchesSearch = searchQuery ? image.label.toLowerCase().includes(searchQuery.toLowerCase()) : true;

      return matchesOs && matchesVariant && matchesRelease && matchesSearch;
    });

    this.emptyMessage.set(filtered.length ? '' : this.translate.instant('No images found'));
    this.filteredImages.set(filtered);
  }
}

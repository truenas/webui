import { ChangeDetectionStrategy, Component, Inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { catchError, Observable, of } from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { VirtualizationRemote } from 'app/enums/virtualization.enum';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { Option } from 'app/interfaces/option.interface';
import { VirtualizationImage } from 'app/interfaces/virtualization.interface';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-instance-form',
  standalone: true,
  imports: [
    MatTableModule,
    IxFieldsetComponent,
    IxSelectComponent,
    ReactiveFormsModule,
    MatDialogContent,
    MatDialogActions,
    MatDialogModule,
    TranslateModule,
    IxIconComponent,
    IxInputComponent,
    MatButton,
    MatIconButton,
    TestDirective,
    EmptyComponent,
  ],
  templateUrl: './instance-form.component.html',
  styleUrls: ['./instance-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstanceFormComponent implements OnInit {
  protected readonly columns = ['label', 'os', 'release', 'arch', 'variant', 'actions'];
  form: FormGroup;

  osOptions$: Observable<Option[]>;
  variantOptions$: Observable<Option[]>;
  releaseOptions$: Observable<Option[]>;

  images = signal<VirtualizationImage[]>([]);
  filteredImages = signal<VirtualizationImage[]>([]);
  entityEmptyConf = signal({
    type: EmptyType.Loading,
    large: true,
  } as EmptyConfig);

  constructor(
    private ws: WebSocketService,
    private dialogRef: MatDialogRef<InstanceFormComponent>,
    private fb: FormBuilder,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    @Inject(MAT_DIALOG_DATA) protected data: { remote: VirtualizationRemote },
  ) {
    this.form = this.fb.group({
      os: [''],
      variant: [''],
      release: [''],
      searchQuery: [''],
    });

    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe(() => this.filterImages());
  }

  ngOnInit(): void {
    this.getImages();
  }

  onClose(): void {
    this.dialogRef.close();
  }

  selectImage(image: VirtualizationImage): void {
    this.dialogRef.close(image);
  }

  private getImages(): void {
    this.ws.call('virt.instance.image_choices', [this.data])
      .pipe(
        catchError((error: unknown) => {
          this.errorHandler.showErrorModal(error);
          return of(error);
        }),
        untilDestroyed(this),
      )
      .subscribe((images: VirtualizationImage[]) => {
        this.setFilteringOptions(images);
        this.filterImages();
      });
  }

  private setFilteringOptions(images: VirtualizationImage[]): void {
    const osSet = new Set<string>();
    const variantSet = new Set<string>();
    const releaseSet = new Set<string>();

    const imageArray = Object.values(images);
    this.images.set(imageArray);

    imageArray.forEach((image: VirtualizationImage) => {
      osSet.add(image.os);
      variantSet.add(image.variant);
      releaseSet.add(image.release);
    });

    this.osOptions$ = of([...osSet].map((os) => ({ label: os, value: os })));
    this.variantOptions$ = of([...variantSet].map((variant) => ({ label: variant, value: variant })));
    this.releaseOptions$ = of([...releaseSet].map((release) => ({ label: release, value: release })));
  }

  private filterImages(): void {
    const { os, variant, release, searchQuery } = this.form.value as {
      os: string; variant: string; release: string; searchQuery: string;
    };

    const filtered = this.images().filter((image) => {
      const matchesOs = os ? image.os === os : true;
      const matchesVariant = variant ? image.variant === variant : true;
      const matchesRelease = release ? image.release === release : true;
      const matchesSearch = searchQuery ? image.label.toLowerCase().includes(searchQuery.toLowerCase()) : true;

      return matchesOs && matchesVariant && matchesRelease && matchesSearch;
    });

    if (!filtered.length) {
      this.entityEmptyConf.set({
        type: EmptyType.NoSearchResults,
        large: true,
        title: this.translate.instant('No images found'),
      });
    }

    this.filteredImages.set(filtered);
  }
}

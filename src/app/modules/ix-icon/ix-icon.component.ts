import {
  AfterContentInit,
  Attribute,
  ChangeDetectionStrategy,
  Component,
  ElementRef, HostBinding,
  Inject, Input, input,
  OnChanges,
  OnInit,
  Optional,
} from '@angular/core';
import {
  MatIcon, MatIconDefaultOptions, MatIconLocation, MAT_ICON_DEFAULT_OPTIONS, MAT_ICON_LOCATION,
} from '@angular/material/icon';
import { IconErrorHandlerService } from 'app/modules/ix-icon/icon-error-handler.service';
import { IxIconRegistry } from 'app/modules/ix-icon/ix-icon-registry.service';

/**
 * IxIcon component extends MatIcon
 * It provides single interface to access all icons in the app.
 * You can use:
 * - Google's material icons `<ix-icon name="left-arrow"></ix-icon>`
 * - material design icons (https://pictogrammers.com/library/mdi/) `<ix-icon name="mdi-left-arrow"></ix-icon>`
 * - custom icons `<ix-icon name="ix-left-arrow"></ix-icon>` added to `src/assets/icons/custom`.
 *
 * More information on how icon sprite works is available in the assets/icons/README.md.
 */
@Component({
  selector: 'ix-icon',
  exportAs: 'ixIcon',
  host: {
    class: 'ix-icon',
    '[attr.data-mat-icon-name]': '(_svgIcon && _svgName) || fontIcon',
    '[attr.data-mat-icon-namespace]': '(_svgIcon && _svgNamespace) || fontSet',
  },
  styleUrls: ['./ix-icon.component.scss'],
  templateUrl: 'ix-icon.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class IxIconComponent extends MatIcon implements OnInit, OnChanges, AfterContentInit {
  /**
   * Do not apply ordinary 24px size to the icon.
   */
  @Input()
  @HostBinding('class.full-size')
  fullSize = false;

  readonly name = input<string>();

  override _elementRef: ElementRef<HTMLElement>;

  private get iconName(): string | undefined {
    if (this.name()) {
      return this.name();
    }

    if (this.iconLigature) {
      return this.iconLigature;
    }

    if (this.svgIcon) {
      return this.svgIcon;
    }

    if (this.fontIcon) {
      return this.fontIcon;
    }

    return undefined;
  }

  private set iconLigature(iconName: string) {
    this._elementRef.nativeElement.innerText = iconName;
  }

  private get iconLigature(): string {
    return this._elementRef?.nativeElement?.innerText;
  }

  constructor(
    elementRef: ElementRef<HTMLElement>,
    iconRegistry: IxIconRegistry,
    @Attribute('aria-hidden') ariaHidden: string,
    @Inject(MAT_ICON_LOCATION) location: MatIconLocation,
    readonly errorHandler: IconErrorHandlerService,
    @Optional() @Inject(MAT_ICON_DEFAULT_OPTIONS) defaults?: MatIconDefaultOptions,
  ) {
    super(elementRef, iconRegistry, ariaHidden, location, errorHandler, defaults);
  }

  ngOnChanges(): void {
    this.updateIcon(this.name());
  }

  override ngOnInit(): void {
    this.updateIcon(this.iconName);
    super.ngOnInit();
  }

  ngAfterContentInit(): void {
    this.updateIcon(this.iconName);
  }

  private updateIcon(iconName: string | undefined): void {
    if (!iconName) {
      return;
    }
    this.svgIcon = iconName;
  }
}

import {
  AfterContentInit,
  Attribute,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ErrorHandler,
  Inject,
  Input,
  OnChanges,
  OnInit,
  Optional,
  ViewEncapsulation,
} from '@angular/core';
import {
  MatIcon, MatIconDefaultOptions, MatIconLocation, MatIconRegistry, MAT_ICON_DEFAULT_OPTIONS, MAT_ICON_LOCATION,
} from '@angular/material/icon';

/**
 * IxIcon component extends MatIcon
 * It provides single interface to access all icons in the app
 * Examples:
 *     `<ix-icon name="left-arrow"></ix-icon>
 *     <ix-icon name="mdi-left-arrow"></ix-icon>
 *     <ix-icon name="ix:left-arrow"></ix-icon>`
 */
@Component({
  selector: 'ix-icon',
  exportAs: 'ixIcon',
  // eslint-disable-next-line @angular-eslint/no-host-metadata-property
  host: {
    class: 'ix-icon',
    '[attr.data-mat-icon-name]': '(_svgIcon && _svgName) || fontIcon',
    '[attr.data-mat-icon-namespace]': '(_svgIcon && _svgNamespace) || fontSet',
  },
  styleUrls: ['./ix-icon.component.scss'],
  templateUrl: 'ix-icon.component.html',
  // eslint-disable-next-line @angular-eslint/use-component-view-encapsulation
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxIconComponent extends MatIcon implements OnInit, OnChanges, AfterContentInit {
  @Input() name: string;

  _elementRef: ElementRef<HTMLElement>;

  private get iconName(): string {
    if (this.name) {
      return this.name;
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
    iconRegistry: MatIconRegistry,
    @Attribute('aria-hidden') ariaHidden: string,
    @Inject(MAT_ICON_LOCATION) location: MatIconLocation,
    readonly errorHandler: ErrorHandler,
    @Optional() @Inject(MAT_ICON_DEFAULT_OPTIONS)
    defaults?: MatIconDefaultOptions,
  ) {
    super(elementRef, iconRegistry, ariaHidden, location, errorHandler, defaults);
  }

  ngOnChanges(): void {
    this.updateIcon(this.name);
  }

  ngOnInit(): void {
    this.updateIcon(this.iconName);
    super.ngOnInit();
  }

  ngAfterContentInit(): void {
    this.updateIcon(this.iconName);
  }

  private updateIcon(iconName: string): void {
    switch (true) {
      case ((!iconName)):
        this.svgIcon = '';
        this.fontSet = '';
        this.fontIcon = '';
        this.iconLigature = '';
        break;
      case (iconName.startsWith('ix:')):
        this.fontIcon = '';
        this.fontSet = '';
        this.svgIcon = iconName;
        break;
      case (iconName.startsWith('mdi')):
        this.svgIcon = '';
        this.iconLigature = '';
        this.fontSet = 'mdi-set';
        this.fontIcon = iconName;
        break;
      default:
        this.fontSet = '';
        this.svgIcon = '';
        this.fontIcon = iconName;
        this.iconLigature = iconName;
    }
  }
}

import {
  Attribute, ChangeDetectionStrategy, Component, ElementRef,
  ErrorHandler, Inject, Input, OnInit, Optional, ViewEncapsulation,
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
  },
  styleUrls: ['./ix-icon.component.scss'],
  templateUrl: 'ix-icon.component.html',
  // eslint-disable-next-line @angular-eslint/use-component-view-encapsulation
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxIconComponent extends MatIcon implements OnInit {
  @Input() name: string;

  private get iconName(): string {
    if (this.iconLigature) {
      return this.iconLigature;
    }

    if (this.name) {
      return this.name;
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
    private iconRegistry: MatIconRegistry,
    @Attribute('aria-hidden') ariaHidden: string,
    @Inject(MAT_ICON_LOCATION) private location: MatIconLocation,
    private readonly errorHandler: ErrorHandler,
    @Optional() @Inject(MAT_ICON_DEFAULT_OPTIONS)
    defaults?: MatIconDefaultOptions,
  ) {
    super(elementRef, iconRegistry, ariaHidden, location, errorHandler, defaults);
  }

  ngOnInit(): void {
    if (this.iconName.startsWith('ix:')) {
      this.svgIcon = this.iconName;
    } else if (this.iconName.startsWith('mdi')) {
      this.fontSet = 'mdi-set';
      this.fontIcon = this.iconName;
    } else {
      this.fontIcon = this.iconName;
      this.iconLigature = null;
    }
    super.ngOnInit();
  }
}

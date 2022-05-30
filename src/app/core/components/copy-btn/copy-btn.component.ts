import {
  Component, Input, ViewChild, ElementRef,
} from '@angular/core';

@Component({
  selector: 'ix-copy-btn',
  templateUrl: './copy-btn.component.html',
  styleUrls: ['./copy-btn.component.scss'],
})
export class CopyButtonComponent {
  @ViewChild('el', { static: false }) el: ElementRef;
  @Input() text: string;
  @Input() showPopup = true;
  popupIsVisible = false;

  onIconClick(): void {
    this.popupIsVisible = !this.popupIsVisible;
    this.copyToClipboard();
  }

  onPopupClose(): void {
    this.popupIsVisible = false;
  }

  copyToClipboard(): void {
    this.el.nativeElement.focus();
    this.el.nativeElement.select();
    document.execCommand('copy');
  }
}

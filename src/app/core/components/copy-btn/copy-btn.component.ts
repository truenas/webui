import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { MaterialModule } from '../../../appMaterial.module';


@Component({
  selector: 'copy-btn',
  templateUrl: './copy-btn.component.html',
  styleUrls: ['./copy-btn.component.css']
})
export class CopyButtonComponent {

  @ViewChild('el', { static: false}) el: ElementRef;
  @Input() text: string;
  @Input() showPopup = true;
  public popupIsVisible: boolean = false;

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
    document.execCommand("copy");
  }


}

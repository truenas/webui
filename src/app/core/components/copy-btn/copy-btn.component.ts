import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { MaterialModule } from '../../../appMaterial.module';


@Component({
  selector: 'copy-btn',
  templateUrl: './copy-btn.component.html',
  styleUrls: ['./copy-btn.component.css']
})
export class CopyButtonComponent implements OnInit {
  
  @ViewChild('el', { static: false}) el: ElementRef;  
  @Input() text: string;
  @Input() showPopup = true;
  public popupIsVisible: boolean = false;

  constructor() {
  }

  ngOnInit() {
  }

  onIconClick(){
    this.popupIsVisible = !this.popupIsVisible;
    this.copyToClipboard();
  }

  onPopupClose(){
    this.popupIsVisible = false;
  }

  copyToClipboard(){
    this.el.nativeElement.focus();
    this.el.nativeElement.select();
    (<any>document).execCommand("copy");
  }


}

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
  public popupIsVisible: boolean = false;

  constructor() {
  }

  ngOnInit() {
  }

  onIconClick(){
    this.popupIsVisible = !this.popupIsVisible;
    this.copyToClipboard();
    /*setTimeout(() => {
      this.popupIsVisible = false;
    }, 3000);*/
  }

  onPopupClose(){
    this.popupIsVisible = false;
  }

  copyToClipboard(){
    console.log(this.el);
    this.el.nativeElement.focus();
    this.el.nativeElement.select();
    (<any>document).execCommand("copy");
  }


}

import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { toSvg } from 'jdenticon';

@Pipe({
  name: 'userAvatar',
  pure: true,
})
export class UserAvatarPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(username: string): SafeHtml {
    // eslint-disable-next-line sonarjs/no-angular-bypass-sanitization
    return this.sanitizer.bypassSecurityTrustHtml(toSvg(username, 25));
  }
}

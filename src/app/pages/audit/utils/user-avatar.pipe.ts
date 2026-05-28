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
    // jdenticon.toSvg hashes the input and emits a deterministic identicon
    // (<svg> + <rect>/<path>); the username is never interpolated into the
    // markup, so this bypass is safe even if username comes from untrusted data.
    // eslint-disable-next-line sonarjs/no-angular-bypass-sanitization
    return this.sanitizer.bypassSecurityTrustHtml(toSvg(username, 25));
  }
}

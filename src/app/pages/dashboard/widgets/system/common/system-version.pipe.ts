import { Pipe, PipeTransform } from '@angular/core';
import { Codename, versionToCodeNames } from 'app/enums/codename.enum';

@Pipe({
  name: 'systemVersion',
  standalone: true,
})
export class SystemVersionPipe implements PipeTransform {
  transform(value: string, codename?: Codename): string {
    return this.getVersion(value, codename);
  }

  private getVersion(version: string, codename?: Codename): string {
    const versionMatch = version.match(/\d+\.\d+\.\d+/);
    const semanticVersion = versionMatch ? versionMatch[0] : version;
    if (codename) {
      return `${semanticVersion} - ${codename}`;
    }
    const codeNameFromSemanticVersion = versionToCodeNames.get(semanticVersion.slice(0, 5));
    if (codeNameFromSemanticVersion) {
      return `${semanticVersion} - ${codeNameFromSemanticVersion}`;
    }
    return semanticVersion;
  }
}

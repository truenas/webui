export class CommonUtils {
  versionCompare(a: string, b: string): number {
    if (a === b) {
      return 0;
    }

    const aParts = a.split('.');
    const bParts = b.split('.');

    const len = Math.min(aParts.length, bParts.length);

    // loop while the components are equal
    for (let i = 0; i < len; i++) {
      // A bigger than B
      if (parseInt(aParts[i]) > parseInt(bParts[i])) {
        return -1;
      }

      // B bigger than A
      if (parseInt(aParts[i]) < parseInt(bParts[i])) {
        return 1;
      }
    }

    // If one's a prefix of the other, the longer one is greater.
    if (aParts.length > bParts.length) {
      return -1;
    }

    if (aParts.length < bParts.length) {
      return 1;
    }

    // Otherwise they are the same.
    return 0;
  }

  capitalizeFirstLetter(text: string): string {
    text = text.toLowerCase();
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
}

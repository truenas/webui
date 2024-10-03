export function warnAboutDuplicates(icons: Set<string>): void {
  icons.forEach((icon) => {
    if (icon.startsWith('mdi-')) {
      return;
    }

    if (!icons.has(`mdi-${icon}`)) {
      return;
    }

    console.warn(`Both "${icon}" and "mdi-${icon}" are used in the application. Consider only using the 'mdi' version.`);
  });
}

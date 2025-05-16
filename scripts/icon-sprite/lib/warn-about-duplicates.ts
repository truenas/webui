export function warnAboutDuplicates(icons: Set<string>): void {
  let hasDuplicates = false;

  icons.forEach((icon) => {
    if (icon.startsWith('mdi-')) {
      return;
    }

    if (!icons.has(`mdi-${icon}`)) {
      return;
    }

    hasDuplicates = true;
    console.error(`Both "${icon}" and "mdi-${icon}" are used in the application. Consider only using the 'mdi' version.`);
  });

  if (hasDuplicates) {
    process.exit(1);
  }
}

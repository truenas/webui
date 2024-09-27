export function getIconPaths(names: Set<string>): Map<string, string> {
  const iconPaths = new Map<string, string>();

  names.forEach((name) => {
    if (name.startsWith('ix-')) {
      iconPaths.set(name, `src/assets/icons/custom/${name.slice(3)}.svg`);
      return;
    }

    if (name.startsWith('mdi-')) {
      iconPaths.set(name, `node_modules/@mdi/svg/svg/${name.slice(4)}.svg`);
      return;
    }

    iconPaths.set(name, `node_modules/@material-design-icons/svg/filled/${name}.svg`);
  });

  return iconPaths;
}

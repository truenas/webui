import { execSync } from 'node:child_process';

export function findIconsWithMarker(path: string): Set<string> {
  const command = `grep -rEo "iconMarker\\\\('[^']+'" --include="*.ts" --include="*.html" ${path}`;

  const icons = new Set<string>();
  try {
    const output = execSync(command, { encoding: 'utf-8' });
    output
      .split('\n')
      .filter(Boolean)
      .forEach((line) => {
        const [, match] = line.split(':');
        const value = /'([^']+)'/.exec(match)?.[1];
        if (!value) {
          return;
        }

        icons.add(value);
      });
  } catch {
    // grep returns non-zero exit code when no matches found
    // This is expected after migrating to tnIconMarker
  }

  return icons;
}

import fs from 'fs';
import Spriter from 'svg-sprite';
import File from 'vinyl';

export type SpriteResult = Record<string, { sprite: File }>;

export async function buildSprite(icons: Map<string, string>): Promise<SpriteResult> {
  const spriter = new Spriter({
    mode: {
      stack: true,
    },
  });

  const bobr = [
    'ix-network-upload-download',
    'ix-network-upload-download-disabled',
    'info_outline',
  ];

  icons.forEach((path, name) => {
    try {
      if (bobr.includes(name)) {
        return;
      }
      spriter.add(name, null, fs.readFileSync(path, 'utf-8'));
    } catch (error) {
      console.error(`Failed to add icon "${name}": `);
      throw error;
    }
  });

  const { result } = await spriter.compileAsync() as { result: SpriteResult };
  return result;
}

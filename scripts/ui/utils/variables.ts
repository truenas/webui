// TODO: Can be simplified in node 20.11+
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// eslint-disable-next-line @typescript-eslint/naming-convention
const __dirname = dirname(fileURLToPath(import.meta.url));

const root = `${__dirname}/../../../`;
export const environmentTs = `${root}src/environments/environment.ts`;
export const environmentTemplate = `${root}scripts/ui/environment.ts.template`;

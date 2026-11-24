// Prépare le dossier de publication attendu par Sites.
import { copyFile, cp, mkdir } from 'node:fs/promises';

const root = new URL('./', import.meta.url);
const output = new URL('./dist/', root);

await mkdir(output, { recursive: true });
for (const name of ['index.html', 'app.js', 'style.css']) {
  await copyFile(new URL(name, root), new URL(name, output));
}
await cp(new URL('photos/', root), new URL('photos/', output), { recursive: true });

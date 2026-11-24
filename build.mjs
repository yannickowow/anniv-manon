// Prépare le dossier de publication attendu par Sites.
import { copyFile, mkdir, readdir } from 'node:fs/promises';

const root = new URL('./', import.meta.url);
const output = new URL('./dist/', root);
const images = (await readdir(root)).filter(name => name.endsWith('.jpg'));

await mkdir(output, { recursive: true });
for (const name of ['index.html', 'app.js', 'style.css', ...images]) {
  await copyFile(new URL(name, root), new URL(name, output));
}

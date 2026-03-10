import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(currentDirectory, '..');
const sourceDirectory = path.join(repositoryRoot, 'frontend', 'dist');
const targetDirectory = path.join(repositoryRoot, 'dist');

if (!existsSync(sourceDirectory)) {
  throw new Error(`Frontend build output not found at ${sourceDirectory}`);
}

rmSync(targetDirectory, { recursive: true, force: true });
mkdirSync(targetDirectory, { recursive: true });
cpSync(sourceDirectory, targetDirectory, { recursive: true });
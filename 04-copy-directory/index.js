const {
  readdir,
  mkdir,
  rm,
  copyFile,
} = require('fs/promises');
const path = require('path');
const { stdout } = require('process');


const SOURCE_FOLDER = 'files';
const DESTINATION_FOLDER = 'files-copy';

const sourceFolder = path.join(__dirname, SOURCE_FOLDER);
const destFolder = path.join(__dirname, DESTINATION_FOLDER);

async function copyDir() {
  const destDirCreation = await mkdir(destFolder, { recursive: true });

  if (!destDirCreation) {
    const files = await readdir(destFolder);
    
    for (const fileName of files) {
      const file = path.join(destFolder, fileName);
      await rm(file);
    }
  }

  const sourceDirEntries = await readdir(sourceFolder, { withFileTypes: true });
  const sourceFiles = sourceDirEntries.filter(entry => entry.isFile());

  for (const file of sourceFiles) {
    const sourcePath = path.join(sourceFolder, file.name);
    const destPath = path.join(destFolder, file.name);

    await copyFile(sourcePath, destPath);
  }
}

copyDir().catch(err => stdout.write(err.message));

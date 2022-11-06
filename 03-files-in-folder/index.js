const fs = require('fs');
const { readdir } = require('fs/promises');
const path = require('path');
const { stdout } = require('process');


const DIR_NAME = 'secret-folder';

const dir = path.join(__dirname, DIR_NAME);

async function showFiles() {
  try {
    const files = await readdir(dir, { encoding: 'utf8' });

    for (const file of files) {
      const pathToFile = path.join(__dirname, DIR_NAME, file);
      const fileExtension = path.extname(pathToFile);
      const fileExtensionWithoutDot = fileExtension.replace(/^\./, '');
      const fileName = file.slice(0, file.lastIndexOf(fileExtension));

      fs.stat(pathToFile, (err, fileStats) => {
        if (err) {
          stdout.write(err.message);
          return;
        }

        if (!fileStats.isFile()) {
          return;
        }

        const sizeInKb = Math.round((fileStats.size / 1024) * 1000) / 1000;
        stdout.write(`${fileName} - ${fileExtensionWithoutDot} - ${sizeInKb}kb\n`);
      });
    }
  } catch (err) {
    stdout.write(err.message);
  }
}

showFiles();

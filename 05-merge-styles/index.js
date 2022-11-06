const fs = require('fs');
const {
  readdir,
  mkdir,
  rm,
} = require('fs/promises');
const path = require('path');
const { stdout } = require('process');


const ENTRY_FOLDER = 'styles';
const DISTRIBUTABLE_FOLDER = 'project-dist';
const BUNDLE_EXTENSION = '.css';
const BUNDLE_NAME = 'bundle';

const entryFolder = path.join(__dirname, ENTRY_FOLDER);
const distFolder = path.join(__dirname, DISTRIBUTABLE_FOLDER);
const bundle = path.join(distFolder, `${BUNDLE_NAME}${BUNDLE_EXTENSION}`);

const styles = [];
const addChunkToStyles = (chunk) => styles.push(chunk);
const handleError = (error) => stdout.write(error.message);

function readFileAsync(file, cb) {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(file, { encoding: 'utf8' });
    
    const handleError = (error) => {
      stdout.write(`Error is occurred while reading file: ${error.message}`);
      reject(error.message);
    }
    
    stream.on('data', cb);
    stream.on('end', resolve);
    stream.on('error', handleError);
  });
}

async function createCSSBundle() {
  const distFolderCreation = await mkdir(distFolder, { recursive: true });

  if (!distFolderCreation) {
    const files = await readdir(distFolder);

    if (files.includes(BUNDLE_NAME)) {
      const prevBundle = path.join(distFolder, BUNDLE_NAME);
      await rm(prevBundle);
    }
  }

  const entryDirFiles = await readdir(entryFolder, { withFileTypes: true });
  const sourceStyles = entryDirFiles.filter(file => {
    const pathToFile = path.join(entryFolder, file.name);
    const isValidFileExtension = path.extname(pathToFile) === BUNDLE_EXTENSION;

    return file.isFile() && isValidFileExtension;
  });
    
  const handleReadError = (error) => {
    stdout.write(`Error is occurred while reading CSS files: ${error.message}`);
  }

  for (const file of sourceStyles) {
    const pathToFile = path.join(entryFolder, file.name);
    await readFileAsync(pathToFile, addChunkToStyles).catch(handleReadError);
  }

  const writeStream = fs.createWriteStream(bundle, { encoding: 'utf8' });
    
  const handleWriteError = (error) => {
    stdout.write(`Error is occurred while writing CSS bundle: ${error.message}`);
    writeStream.end(`Error is occurred: ${error.message}`);
  }
  writeStream.on('error', handleWriteError);

  for (const styleChunk of styles) {
    writeStream.write(styleChunk + '\n');
  }
}

createCSSBundle().catch(handleError);

const fs = require('fs');
const {
  readdir,
  mkdir,
  rm,
  copyFile,
} = require('fs/promises');
const path = require('path');
const { stdout } = require('process');

const DISTRIBUTABLE_FOLDER = 'project-dist';
const COMPONENTS_FOLDER = 'components';
const ASSETS_FOLDER = 'assets';
const BUNDLE_STYLES = {
  ENTRY: 'styles',
  EXTENSION: '.css',
  NAME: 'style',
};
const DOCUMENT_HTML = {
  ENTRY: 'template.html',
  EXTENSION: '.html',
  NAME: 'index',
};

const distFolder = path.join(__dirname, DISTRIBUTABLE_FOLDER);
const componentsFolder = path.join(__dirname, COMPONENTS_FOLDER);
const assetsEntryFolder = path.join(__dirname, ASSETS_FOLDER);
const stylesEntryFolder = path.join(__dirname, BUNDLE_STYLES.ENTRY);
const htmlEntryTemplate = path.join(__dirname, DOCUMENT_HTML.ENTRY);
const cssBundle = path.join(distFolder, `${BUNDLE_STYLES.NAME}${BUNDLE_STYLES.EXTENSION}`);
const HTMLDocument = path.join(distFolder, `${DOCUMENT_HTML.NAME}${DOCUMENT_HTML.EXTENSION}`);

const styles = [];
const addChunkToStyles = (chunk) => styles.push(chunk);
const handleError = (error) => stdout.write(error.message);

function getHTMLComponent(match, component) {
  return new Promise((resolve, reject) => {
    const pathToComponent = path.join(componentsFolder, `${component}.html`);
    const stream = fs.createReadStream(pathToComponent, { encoding: 'utf8' });

    let htmlComponent = '';

    const handleError = (error) => {
      stdout.write(`Error is occurred while reading HTML component: ${error.message}`);
      reject(error.message);
    }
    
    stream.on('data', (chunk) => htmlComponent += chunk);
    stream.on('end', () => resolve(htmlComponent));
    stream.on('error', handleError);
  });
}

async function replaceAsync(str, regex, asyncFn) {
  const promises = [];
  str.replace(regex, (match, ...args) => {
    const promise = asyncFn(match, ...args);
    promises.push(promise);
  });
  const data = await Promise.all(promises);
  return str.replace(regex, () => data.shift());
}

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

async function makeDir(folder) {
  const dirCreation = await mkdir(folder, { recursive: true });

  if (!dirCreation) {
    const files = await readdir(folder);
    
    for (const fileName of files) {
      const file = path.join(folder, fileName);
      await rm(file, { recursive: true, force: true });
    }
  }
}

function createHTMLFromTemplate() {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(htmlEntryTemplate, { encoding: 'utf8' });
    const writeStream = fs.createWriteStream(HTMLDocument, { encoding: 'utf8' });
    let html = '';

    const handleError = (error) => {
      stdout.write(`Error is occurred while creating HTML from template: ${error.message}`);
      readStream.destroy();
      writeStream.end(`Error is occurred: ${error.message}`);
      reject(error.message);
    }
    
    readStream.on('data', chunk => {
      html += chunk;
    });

    readStream.on('error', handleError);
    readStream.on('end', () => {
      replaceAsync(html, /{{(.+)}}/g, getHTMLComponent)
        .then((replacedHTML) => {
          writeStream.write(replacedHTML);
          writeStream.end();
          resolve();
        })
      
    });
  });
}

async function createCSSBundle() {
  const entryDirFiles = await readdir(stylesEntryFolder, { withFileTypes: true });
  const sourceStyles = entryDirFiles.filter(file => {
    const pathToFile = path.join(stylesEntryFolder, file.name);
    const isValidFileExtension = path.extname(pathToFile) === BUNDLE_STYLES.EXTENSION;

    return file.isFile() && isValidFileExtension;
  });

  const handleError = (error) => {
    stdout.write(`Error is occurred while creating CSS bundle: ${error.message}`);
  }

  for (const file of sourceStyles) {
    const pathToFile = path.join(stylesEntryFolder, file.name);
    await readFileAsync(pathToFile, addChunkToStyles).catch(handleError);
  }

  const writeStream = fs.createWriteStream(cssBundle, { encoding: 'utf8' });
  writeStream.on('error', handleError);

  for (const styleChunk of styles) {
    writeStream.write(styleChunk + '\n');
  }
}

async function copyAssets() {
  async function copyFiles(sourceFolder, destFolder) {
    await makeDir(destFolder);
    const dirEntries = await readdir(sourceFolder, { withFileTypes: true });

    for (const dirEntry of dirEntries) {
      const sourcePath = path.join(sourceFolder, dirEntry.name);
      const destPath = path.join(destFolder, dirEntry.name);

      if (dirEntry.isDirectory()) {
        await copyFiles(sourcePath, destPath);
      }

      if (dirEntry.isFile()) {
        await copyFile(sourcePath, destPath);
      }
    }
  }

  const assetsCopy = path.join(distFolder, ASSETS_FOLDER);
  await copyFiles(assetsEntryFolder, assetsCopy);
}

makeDir(distFolder)
  .then(createHTMLFromTemplate)
  .then(createCSSBundle)
  .then(copyAssets)
  .catch(handleError);

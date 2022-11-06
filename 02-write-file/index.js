const fs = require('fs');
const path = require('path');
const { stdin: input, stdout: output } = require('process');
const readline = require('readline');


const FILE_NAME = 'text.txt';
const COMMAND_EXIT = 'exit';

const file = path.join(__dirname, FILE_NAME);
const writeStream = fs.createWriteStream(file, { encoding: 'utf8' });
const rl = readline.createInterface({ input, output });

const endWritingFile = () => {
  writeStream.close();
  rl.close();
};

const addLineToFile = (line) => {
  if (line == COMMAND_EXIT) {
    endWritingFile();
  } else {
    writeStream.write(line + '\n');
  }
};

const handleError = (error) => output.write(error.message);
writeStream.on('error', handleError);

rl.on('line', addLineToFile);
rl.on('SIGINT', endWritingFile);
rl.question('Type something to add to the text.txt >> ', addLineToFile);

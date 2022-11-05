const fs = require('fs');
const path = require('path');
const process = require('process');


const FILE_NAME = 'text.txt';

const file = path.join(__dirname, FILE_NAME);
const write = process.stdout.write.bind(process.stdout);
const stream = fs.createReadStream(file, { encoding: 'utf8' });

stream.on('data', write);

const handleError = (error) => process.stdout.write(error.message);
stream.on('error', handleError);

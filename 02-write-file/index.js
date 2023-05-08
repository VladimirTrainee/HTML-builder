const {WriteStream} = require('fs');
const path = require('path');
const { stdin, stdout} = process;
const stream = new WriteStream(path.join(__dirname, 'text.txt'), { encoding: 'utf-8', flags: 'a' });
const finish = () => { stdout.write('Process has been ended') ; process.exit(); }

stream.on('error', error => console.log(error));
stdout.write('Enter a text to file\n'); 
stdin.on('data', (data) => {
   if (data) {
     if (String(data) === 'exit\r\n') finish();
     if (data) stream.write(data);
   }
 }); 
process.on('SIGINT', finish) ;
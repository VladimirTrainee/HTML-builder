const { ReadStream} = require('fs');
const path = require('path');
const stream = new ReadStream(path.join(__dirname, 'text.txt'), { encoding: 'utf-8' });

stream.on('readable', function () {
  const data = stream.read();
  if (data) console.log(data);
});

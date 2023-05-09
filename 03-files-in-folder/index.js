const { readdir } = require('node:fs/promises');
const { stat } = require('fs');
const path = require('path');
const folder = 'secret-folder';

readdir(path.join(__dirname, folder), {withFileTypes: true})
  .then( dirs => dirs.forEach( dir  => {
    if (dir.isFile()) { 
      const type = dir.name.split('.').pop();
      const name = dir.name.substring(0, dir.name.length - type.length - 1);
      stat(path.join(__dirname, folder, dir.name), (error, data) => {
        if (error) console.log(error);
        const size = (data.size / 1024).toFixed(3) ;
        console.log(`${name} - ${type} - ${size}kb`);
      }); 
    }
  }))
  .catch(e => console.log(e));


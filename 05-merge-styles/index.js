const path = require('path');
const { readdir, readFile, writeFile } = require('node:fs/promises');

const baseDir = [path.resolve(__dirname, 'styles'), path.resolve(__dirname, 'project-dist')];
const extMask = '.css';
const toFile = 'bundle.css';

async function getFiles(base) {
  const toList = async (file) => {
    const isDir = file.isDirectory();
    if (path.parse(file.name).ext === extMask || isDir) {
      const add = path.resolve(base, file.name);
      return  (isDir) ? getFiles(add) : add;
    } 
  }

  const dirnames = await readdir(path.resolve(base), { withFileTypes: true });
  const files = await Promise.all( dirnames.map(toList));
  return Array.prototype.concat(...files);
}

const compact = async (files) => {

  const compact = []; 
  for (const file of files[0]) {
    if (file) compact.push(file);
  }
  return compact;
}

const merge = async (files) => {

   return Promise.all(files.map(file => readFile(file, { encoding: 'utf-8' })))
   .then (data => writeFile(path.resolve(baseDir[1], toFile), data, { encoding: 'utf-8', flag: 'w' }) )
   .then (console.log('Merged'))
   .catch(e => console.log(e));
}

Promise.all([getFiles(baseDir[0])])
  .then(compact)
  .then(merge)
  .catch(e => console.error(e));
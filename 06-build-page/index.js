const path = require('path');
const { mkdir, rm , readFile, writeFile, readdir } = require('node:fs/promises');

const FILE_MASK = 'FILE:';
const DIR_MASK = 'DIR:';
const baseDir = [path.resolve(__dirname, ''), path.resolve(__dirname, 'project-dist')];
const schema = [
  ['index.html', 'template', 'template.html', path.join('components', '*.html')],
  ['style.css', 'merge', '', path.join('styles', '*.css')],
  ['assets', 'copy', '', path.join('assets', '*')] 
]

async function getFiles(base, options) {

  const { mask, emptyDir = false, addType = false } = options;
  const dirMask = (emptyDir && addType) ? DIR_MASK : '';
  const fileMask = (addType) ? FILE_MASK : '';
  
  const simpleMask = (text, textMask) => {

    const maskArray = textMask.split('*');
    let result = true;
    if (maskArray.length > 0 ) {
      const start = text.substring(0, maskArray[0].length);
      const end = text.substring(text.length - maskArray[maskArray.length -1 ].length);
      if (start !== maskArray[0] || end != maskArray[maskArray.length - 1]) { result = false }
    }
    return result;
  }

  const getList = async (entry) => {

    const filepath = path.resolve(base, entry.name );
    const filename = (!entry.isDirectory() && simpleMask(String(entry.name), mask)) ? filepath : undefined;
    return (entry.isDirectory()) ? await getFiles(filepath, { ...options }) : `${fileMask}${filename}`;
  }

  const dirnames = await readdir(path.resolve(base), { withFileTypes: true });
  const files = await Promise.all( dirnames.map(dirs =>  getList(dirs)))
  .then(names => names.filter(name => (name)))
  .catch(e => console.log(e));

  return (files && files.length) ? Array.prototype.concat(...files) : [`${dirMask}${base}`];
}

const fileCopy = async (from, to) => {

  return readFile(from)
    .then (data => writeFile(to, data))
    .catch(e => console.log(e));
}

const fileTemplate = async (fromTo , include) => {

  const [from, to] = fromTo;
  const names = include.map(file => path.parse(file).name);

  return Promise.all([from, ...include].map(file => readFile(file, { encoding: 'utf-8' })))
    .then (data => {
      if (data[0]) {
        for (let i = 0; i < names.length; i++) {
          data[0] = data[0].replaceAll(`{{${names[i]}}}`, data[i + 1]);
        }
        writeFile(to, data[0], { encoding: 'utf-8' });
      }
    })
    .catch(e => console.log(e)); 
}

const baseLink = (link) => link.substring((link.startsWith(DIR_MASK)) ? DIR_MASK.length : FILE_MASK.length);

const fileMerge = async (toFile , include) => {

  return Promise.all(include.map(file => readFile(file, { encoding: 'utf-8' })))
    .then (data => writeFile(toFile, data, { encoding: 'utf-8' }))
    .catch(e => console.log(e)); 
}


const dirBatch = async (list) => {

  const actions = list.map(To => mkdir(To, { recursive: true }));
  return Promise.all(actions)
    .catch(e => console.log(e)); 
}

const fileBatchCopy = async (list) => {

  const actions = list.map(fromTo => fileCopy(...fromTo));

  return Promise.all(actions)
    .catch(e => console.log(e));
}

const showTask = (task) => {

  const [to, method, template, source] = task;
  const from = (method === 'template' 
    ? `${path.join(baseDir[0], template)},${path.join(baseDir[0],source)}` 
    : path.join(baseDir[0],source))

  console.log(`Method: ${method}`);
  console.log(`From "${from}"`);
  console.log(`To "${path.join(baseDir[1], to)}"\n`);
}

const initTask = async (task) => {

  const [target, method, template, source] = task;
  const mask = path.basename(source);
  const sourceDir = path.dirname(source);

  let result = task;

  switch (method) {
    case 'merge':
      const mergeTo = path.resolve(baseDir[1], target);
      result = fileMerge(mergeTo, await getFiles(path.resolve(baseDir[0], sourceDir), { mask: mask }))
      break;
    case 'template':
      const templateFromTo = [path.resolve(baseDir[0], template), path.resolve(baseDir[1], target)];
      result = fileTemplate(templateFromTo, await getFiles(path.resolve(baseDir[0], sourceDir), { mask: mask }))
      break;
    case 'copy':
      const copyFrom = path.resolve(baseDir[0], sourceDir);
      const copyTo = path.resolve(baseDir[1], target);
      const copyDirTree = [];
      const copyFromTo = [];

      [... await getFiles(path.resolve(baseDir[0], sourceDir), { mask: mask, emptyDir: true, addType: true } )].forEach(file => {
        const linkFrom = baseLink(file);
        const base = path.relative(copyFrom, linkFrom);
        const linkTo = path.resolve(copyTo, base);
        const linkMask = (file.startsWith(FILE_MASK)) ? FILE_MASK : DIR_MASK;
        let dirAdd = linkTo;
        if (file.startsWith(FILE_MASK)) {
          copyFromTo.push([linkFrom, linkTo]);
          dirAdd = path.dirname(linkTo);
        }

        if (copyDirTree.findIndex(value => value === dirAdd) < 0) copyDirTree.push(dirAdd);
      });

      result = [dirBatch(copyDirTree), fileBatchCopy(copyFromTo)];
      break;
   
  }

  return result;
}

const clearDir = async () => {

  await rm(path.resolve(baseDir[1], ''), { recursive: true, force: true });
  console.log('Target directory has been cleared'); 
  return Promise.resolve();
}

const createDir = async () => {

  await mkdir(path.resolve(baseDir[1], ''), { recursive: true, force: true });
  console.log('Target directory has been created'); 
  return Promise.resolve();
}

const doActions = async () => {

  await Promise.all(schema.map(task => initTask(task)));
  console.log('Actions has been applied');
  return Promise.resolve();
}

schema.forEach(task => showTask(task));
clearDir()
  .then( () => createDir())
  .then( () => doActions())
  .catch(e => console.log(e));


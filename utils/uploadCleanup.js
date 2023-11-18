const fs = require('fs');
const path = require('path');

const directory = './uploads';

module.exports.uploadCleanup = () => fs.readdir(directory, (err, files) => {
  if (err) throw err;
  for (const file of files) {
    fs.unlink(path.join(directory, file), err => {
      if (err) {
        console.log(err)
        return;
        // throw err;
      }
    });
  }
});
const fs = require('fs')
const imgGen = require('js-image-generator')

module.exports.generateImageAsync = (width, height, quality) => {
    return new Promise((resolve, reject) => {
      imgGen.generateImage(width, height, quality, (err, image) => {
        if (err) {
          reject(err); // Reject the promise with the error
        } else {
          resolve(image); // Resolve the promise with the generated image
        }
      });
    });
  };
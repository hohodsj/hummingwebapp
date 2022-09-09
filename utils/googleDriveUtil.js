const googleDriveService = require('../google/GoogleDriveService');
const uuid = require('uuid');
const sharp = require('sharp');
/*
module.exports.uploadImageToDrive = async (file, folderName='ArtWorks') => {
        const metadata = await sharp(file.buffer).metadata();
        const width = metadata.width, height = metadata.height;
        const thumbnailWidth = 800, thumbnailHeight = width > height ? 533 : 1067; // put value in env
        const uploadThumbnailId = await uploadImageHelper(file, folderName, thumbnailWidth, thumbnailHeight);
        const imageWidth = width > height ? 1500 : 1125, imageHeight = width > height ? 999 : 1500;
        const uploadImageId = await uploadImageHelper(file, folderName, imageWidth, imageHeight);
        return [uploadThumbnailId, uploadImageId];
}

uploadImageHelper = async(file, folderName, width, height) => {
    const fileName = `${uuid.v4()}`;
    await sharp(file.buffer).png({quality:100, progressive:true}).jpeg({quality:100, progressive:true}).resize({width: width, height: height}).toFile(`./uploads/${fileName}`);
    const uploadImg = await googleDriveService.saveFile(fileName, `./uploads/${fileName}`, `image/${file.originalname.split('.').pop()}`, folderName)
    return uploadImg.data.id;
}
*/
module.exports.uploadImageToDrive = async (fileBuffer, type, folderName='ArtWorks') => {
    const metadata = await sharp(fileBuffer).metadata();
    const width = metadata.width, height = metadata.height;
    const thumbnailWidth = 800, thumbnailHeight = width > height ? 533 : 1067; // put value in env
    const uploadThumbnailId = await uploadImageHelper(fileBuffer, folderName, thumbnailWidth, thumbnailHeight, type);
    const imageWidth = width > height ? 1500 : 1125, imageHeight = width > height ? 999 : 1500;
    const uploadImageId = await uploadImageHelper(fileBuffer, folderName, imageWidth, imageHeight, type);
    return [uploadThumbnailId, uploadImageId, width > height];
}

uploadImageHelper = async(fileBuffer, folderName, width, height, type) => {
    const fileName = `${uuid.v4()}`;
    await sharp(fileBuffer).png({quality:100, progressive:true}).jpeg({quality:100, progressive:true}).resize({width: width, height: height}).toFile(`./uploads/${fileName}`);
    const uploadImg = await googleDriveService.saveFile(fileName, `./uploads/${fileName}`, `image/${type}`, folderName)
    return uploadImg.data.id;
}

module.exports.deleteImageWithIds = async (ids) => {
    ids.forEach(id => googleDriveService.deleteFile(id));
}
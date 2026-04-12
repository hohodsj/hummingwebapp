/**
 * Formats a collection for portfolio display (cover thumbnail).
 */
module.exports.formatCollectionForPortfolio = (collection) => ({
   collectionName: collection.collectionName,
   isHorizontal: collection.cover.isHorizontal,
   src: `/images/${collection.cover.thumbnailId}.${collection.cover.fileType}`,
});

/**
 * Formats an artwork for collection display (thumbnail + full image).
 * Accepts either a Mongoose doc or a plain object.
 */
module.exports.formatArtworkForDisplay = (artwork) => {
   const obj = artwork.toObject ? artwork.toObject() : artwork;
   const fileType = obj.fileName?.split('.').pop();
   return {
       ...obj,
       thumbnailSrc: `/images/${obj.thumbnailId}.${fileType}`,
       imageSrc: `/images/${obj.imageId}.${fileType}`,
   };
};

const { formatCollectionForPortfolio, formatArtworkForDisplay } = require('../../utils/formatArtwork');

describe('formatArtwork utilities', () => {
   describe('formatCollectionForPortfolio', () => {
       test('returns correct shape with required fields', () => {
           const collection = {
               collectionName: 'Paintings',
               cover: {
                   isHorizontal: true,
                   thumbnailId: 'abc123',
                   fileType: 'jpg',
               },
           };
           const result = formatCollectionForPortfolio(collection);
           expect(result).toEqual({
               collectionName: 'Paintings',
               isHorizontal: true,
               src: '/images/abc123.jpg',
           });
       });

       test('handles vertical images correctly', () => {
           const collection = {
               collectionName: 'Portraits',
               cover: {
                   isHorizontal: false,
                   thumbnailId: 'xyz789',
                   fileType: 'png',
               },
           };
           const result = formatCollectionForPortfolio(collection);
           expect(result.isHorizontal).toBe(false);
           expect(result.src).toBe('/images/xyz789.png');
       });

       test('generates correct image path with different file types', () => {
           const collection = {
               collectionName: 'Mixed',
               cover: {
                   isHorizontal: true,
                   thumbnailId: 'test-id',
                   fileType: 'webp',
               },
           };
           const result = formatCollectionForPortfolio(collection);
           expect(result.src).toBe('/images/test-id.webp');
       });
   });

   describe('formatArtworkForDisplay', () => {
       test('returns thumbnail and image src paths', () => {
           const artwork = {
               thumbnailId: 'thumb1',
               imageId: 'img1',
               fileName: 'photo.png',
               order: 0,
           };
           const result = formatArtworkForDisplay(artwork);
           expect(result.thumbnailSrc).toBe('/images/thumb1.png');
           expect(result.imageSrc).toBe('/images/img1.png');
       });

       test('preserves other artwork properties', () => {
           const artwork = {
               _id: '123',
               thumbnailId: 'thumb1',
               imageId: 'img1',
               fileName: 'photo.jpg',
               order: 5,
               collectionSchema: 'col-123',
           };
           const result = formatArtworkForDisplay(artwork);
           expect(result._id).toBe('123');
           expect(result.order).toBe(5);
           expect(result.collectionSchema).toBe('col-123');
       });

       test('handles Mongoose doc with toObject method', () => {
           const artwork = {
               thumbnailId: 'thumb2',
               imageId: 'img2',
               fileName: 'test.jpg',
               order: 1,
               toObject: function () {
                   return {
                       thumbnailId: 'thumb2',
                       imageId: 'img2',
                       fileName: 'test.jpg',
                       order: 1,
                   };
               },
           };
           const result = formatArtworkForDisplay(artwork);
           expect(result.thumbnailSrc).toBe('/images/thumb2.jpg');
           expect(result.imageSrc).toBe('/images/img2.jpg');
           expect(result.order).toBe(1);
       });

       test('extracts file extension correctly from fileName', () => {
           const testCases = [
               { fileName: 'image.jpeg', expected: 'jpeg' },
               { fileName: 'photo.png', expected: 'png' },
               { fileName: 'art.webp', expected: 'webp' },
               { fileName: 'document.svg', expected: 'svg' },
           ];

           testCases.forEach(({ fileName, expected }) => {
               const artwork = {
                   thumbnailId: 'thumb',
                   imageId: 'img',
                   fileName,
               };
               const result = formatArtworkForDisplay(artwork);
               expect(result.thumbnailSrc).toBe(`/images/thumb.${expected}`);
               expect(result.imageSrc).toBe(`/images/img.${expected}`);
           });
       });

       test('handles plain object artwork data', () => {
           const artwork = {
               thumbnailId: 'plain-thumb',
               imageId: 'plain-img',
               fileName: 'plain.jpg',
           };
           const result = formatArtworkForDisplay(artwork);
           expect(result.thumbnailSrc).toBe('/images/plain-thumb.jpg');
           expect(result.imageSrc).toBe('/images/plain-img.jpg');
       });
   });
});

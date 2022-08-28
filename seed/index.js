const mongoose = require('mongoose');
const CollectionSchema = require('../models/collectionSchema');
const ArtWorkSchema = require('../models/artworkSchema');
const DescriptionSchema = require('../models/descriptionSchema');
const fs = require('fs');
const path = require('path');
const googleDriveUtils = require('../utils/googleDriveUtil');

mongoose.connect('mongodb://localhost:27017/hummingsang-portfolio');

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
})

const artworksGenerate = [
        {
            thumbnailUrl:"https://d33wubrfki0l68.cloudfront.net/06abf97c8574f0627e23e76383d6408fff21169e/1d53b/images/humming-sang/onmyway/1-sm.jpg",
            originalUrl: "https://www.hummingsang.com/images/Humming-Sang/onmyway/1-lg.jpg",
            filename: "On My Way",
            originalWidth: 1280,
            originalHeight: 852,
            thumbnailWidth: 555,
            thumbnailHeight: 370,
            order: 1
        },
        {
            thumbnailUrl:"https://d33wubrfki0l68.cloudfront.net/689e58fce34c3b9885a36b7bc90666728fac7540/bc705/images/humming-sang/quiettime/1-sm.jpg",
            originalUrl: "https://www.hummingsang.com/images/Humming-Sang/quiettime/1-lg.jpg",
            filename: "Quiet Time ",
            originalWidth: 1280,
            originalHeight: 853,
            thumbnailWidth: 555,
            thumbnailHeight: 370,
            order: 2
        },
        {
            thumbnailUrl:"https://d33wubrfki0l68.cloudfront.net/1db7b8084e14131c54e56438edbd1e8b805c2f0b/e0a39/images/humming-sang/hidden/2-sm.jpg",
            originalUrl: "https://www.hummingsang.com/images/Humming-Sang/hidden/2-lg.jpg",
            filename: "Hidden",
            originalWidth: 1315,
            originalHeight: 877,
            thumbnailWidth: 555,
            thumbnailHeight: 370,
            order: 3
        },
        {
            thumbnailUrl:"https://d33wubrfki0l68.cloudfront.net/54c600e092e83aecb9ca59ab03def8663032346e/ac7ed/images/humming-sang/drawing/1-sm.jpg",
            originalUrl: "https://www.hummingsang.com/images/Humming-Sang/drawing/1-lg.jpg",
            filename: "Hidden",
            originalWidth: 1315,
            originalHeight: 877,
            thumbnailWidth: 555,
            thumbnailHeight: 370,
            order: 4
        },

]

const descriptionGenerate = [
        {
            title:'On My Way',
            description:'2019\nBlack mounting board, white ink, acrylic paint, mixed media\n8 1/4 x 6 7/8 inches',
            category:'Collection'
        },
        {
            title:'Quiet Time',
            description:'2019\nWood panel, kraft paper, white ink, acrylic paint, mixed media\n10 x 10 inches',
            category:'Collection'
        },
        {
            title:'Tranquility',
            description:'2019\nBlack mounting board, white ink\n29 x 9 inches',
            category:'Collection'
        },
]

const seedDB = async(howManyCollections) => {
    await CollectionSchema.deleteMany({});
    await ArtWorkSchema.deleteMany({});
    await DescriptionSchema.deleteMany({});
    console.log(artworks);
    var collections = [];
    for(let i = 0; i < howManyCollections; i++) {
        let artworks = []
        for(let j = 0; j < Math.max(1,Math.floor(Math.random() * artworksGenerate.length)); j++) {
            const artwork = new ArtWorkSchema(randomSelectedArtwork);
            await artwork.save();
            artworks.push(artwork);
        }
        const description = new DescriptionSchema(descriptionGenerate[Math.floor(Math.random() * descriptionGenerate.length)]);
        description.save();
        const collection = new CollectionSchema({
                collectionName: `Collection ${i}`,
                cover: artworks[Math.floor(Math.random() * artworks.length)],
                order: i,
                artworks: artworks,
                description: description
            })
        await collection.save();
        collections.push(collection);
    }
}

// seedDB(10).then(() => {
//     mongoose.connection.close();
// })


const seedDB2 = async(howManyCollections) => {
    const directoryPath = path.join(__dirname, 'testuploads');
    const artworks = fs.readdirSync(directoryPath);
    const length = artworks.length;
    for(let i = 0; i < howManyCollections; i++) {
        const selectedImage = artworks[Math.floor(Math.random() * length)];
        const imgPath = path.join(directoryPath, selectedImage);
        const buffer = new Uint8Array(Buffer.from(imgPath)); // needs to figure out buffer
        const [thumbnailId, imgId] = await googleDriveUtils.uploadImageToDrive(buffer, selectedImage.split('.').pop(), 'test');
        console.log(thumbnailId, imgId);
    }
}
seedDB2(1)


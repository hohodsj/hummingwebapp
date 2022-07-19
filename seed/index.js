const mongoose = require('mongoose');
const CollectionSchema = require('../models/collectionSchema');
const ArtWorkSchema = require('../models/artworkSchema');

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
            order: 1
        },
        {
            thumbnailUrl:"https://d33wubrfki0l68.cloudfront.net/689e58fce34c3b9885a36b7bc90666728fac7540/bc705/images/humming-sang/quiettime/1-sm.jpg",
            originalUrl: "https://www.hummingsang.com/images/Humming-Sang/quiettime/1-lg.jpg",
            filename: "Quiet Time ",
            originalWidth: 1280,
            originalHeight: 853,
            order: 2
        },
        {
            thumbnailUrl:"https://d33wubrfki0l68.cloudfront.net/1db7b8084e14131c54e56438edbd1e8b805c2f0b/e0a39/images/humming-sang/hidden/2-sm.jpg",
            originalUrl: "https://www.hummingsang.com/images/Humming-Sang/hidden/2-lg.jpg",
            filename: "Hidden",
            originalWidth: 1315,
            originalHeight: 877,
            order: 3
        },
        {
            thumbnailUrl:"https://d33wubrfki0l68.cloudfront.net/54c600e092e83aecb9ca59ab03def8663032346e/ac7ed/images/humming-sang/drawing/1-sm.jpg",
            originalUrl: "https://www.hummingsang.com/images/Humming-Sang/drawing/1-lg.jpg",
            filename: "Hidden",
            originalWidth: 1315,
            originalHeight: 877,
            order: 4
        },

]

const seedDB = async() => {
    await CollectionSchema.deleteMany({});
    await ArtWorkSchema.deleteMany({});
    var collections = [];
    for(let i = 0; i < 10; i++) {
        let artworks = []
        for(let j = 0; j < Math.max(1,Math.floor(Math.random() * artworksGenerate.length)); j++) {
            const artwork = new ArtWorkSchema(artworksGenerate[j]);
            const res = await artwork.save();
            artworks.push(artwork);
        }
        const collection = new CollectionSchema({
                collectionName: `Colection ${i}`,
                cover: "https://www.hummingsang.com/images/Humming-Sang/Cover%20Images/Tranquility.jpg",
                order: i,
                artworks: artworks
            })
        await collection.save();
        collections.push(collection);
    }
}

seedDB().then(() => {
    mongoose.connection.close();
})


const testArtWork = async() => {
    await ArtWorkSchema.deleteMany({});
    let artworkCollection = []
    for(let j = 0; j < 4; j++) {
        console.log('ith artwork')
        console.log(artworksGenerate[j])
        const artwork = new ArtWorkSchema(artworksGenerate[j]);
        console.log('artwork');
        console.log(artwork);
        const res = await artwork.save();
        console.log(`artwork save status ${res}`);
        artworks.push(artwork);
    }
    console.log("artworks");
    console.log(artworks);
}
/*
testArtWork().then(() => {
    mongoose.connection.close();
})
*/


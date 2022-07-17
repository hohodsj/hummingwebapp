const mongoose = require('mongoose');
const CollectionSchema = require('../models/collectionSchema');

mongoose.connect('mongodb://localhost:27017/hummingsang-portfolio');

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
})
const artworks = [
        {
            url:"https://d33wubrfki0l68.cloudfront.net/06abf97c8574f0627e23e76383d6408fff21169e/1d53b/images/humming-sang/onmyway/1-sm.jpg",
            filename: "On My Way Small",
            width: 555,
            height: 370,
            order: 1
        },
        {
            url:"https://www.hummingsang.com/images/Humming-Sang/onmyway/1-lg.jpg",
            filename: "On My Way Large",
            width: 1280,
            height: 852,
            order: 2
        },
        {
            url:"https://d33wubrfki0l68.cloudfront.net/689e58fce34c3b9885a36b7bc90666728fac7540/bc705/images/humming-sang/quiettime/1-sm.jpg",
            filename: "Quiet Time Small",
            width: 800,
            height: 533,
            order: 3
        },
        {
            url:"https://www.hummingsang.com/images/Humming-Sang/quiettime/1-lg.jpg",
            filename: "On My Way Large",
            width: 1280,
            height: 853,
            order: 4
        },

]

const seedDB = async() => {
    await CollectionSchema.deleteMany({});
    var collections = [];
    for(let i = 0; i < 10; i++) {
        const collection = new CollectionSchema({
                collectionName: `Colection ${i}`,
                cover: "https://www.hummingsang.com/images/Humming-Sang/Cover%20Images/Tranquility.jpg",
                order: i,
                artworks: artworks
            })
        await collection.save();
        collections.push(collection);
    }
    // const portfolio = new PortfolioSchema({
    //     collections
    // })
    // await portfolio.save();
}

seedDB().then(() => {
    mongoose.connection.close();
})
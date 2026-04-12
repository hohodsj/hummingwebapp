const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const CollectionSchema = require('../models/collectionSchema');
const DescriptionSchema = require('../models/descriptionSchema');
const { downloadImages } = require('../utils/googleDriveUtil');
const { formatCollectionForPortfolio, formatArtworkForDisplay } = require('../utils/formatArtwork');
const { buildSitemaps } = require('express-sitemap-xml');

// Portfolio page - shows all visible collections
router.get('/', catchAsync(async (req, res) => {
    const isMobile = req.useragent['isMobile'];
    const collections = await CollectionSchema.find({ $or: [{ isHide: false }, { isHide: null }] })
        .populate('cover')
        .sort({ order: -1 });
    const imageInfos = collections.map(collection => ({ id: collection.cover.thumbnailId, type: collection.cover.fileType }));
    await downloadImages(imageInfos);
    const formattedCollections = collections.map(formatCollectionForPortfolio);
    res.render('portfolio', { formattedCollections, isMobile });
}));

// About/CV page
router.get('/about', catchAsync(async (req, res) => {
    const descriptions = await DescriptionSchema.find({ category: 'CV' }).sort({ order: 1 });
    res.render('about', { descriptions });
}));

// Contact page
router.get('/contact', catchAsync(async (req, res) => {
    const descriptions = await DescriptionSchema.find({ category: 'Social' }).sort({ order: 1 });
    res.render('contact', { descriptions });
}));

// Collection detail page - shows all artworks in a collection
router.get('/collection/:collectionName', catchAsync(async (req, res) => {
    const collectionName = req.params.collectionName;
    const options = { sort: [{ order: 'asc' }] };
    const collection = await CollectionSchema.findOne({ collectionName: collectionName })
        .populate({ path: 'artworks', options })
        .populate('description');
    const thumbnailImageInfos = collection.artworks.map(artwork => ({ id: artwork.thumbnailId, type: artwork.fileType }));
    const actualImageInfos = collection.artworks.map(artwork => ({ id: artwork.imageId, type: artwork.fileType }));
    await downloadImages([...thumbnailImageInfos, ...actualImageInfos]);
    const description = { title: collection.description.title, description: collection.description.description };
    const formattedArtWork = collection.artworks.map(formatArtworkForDisplay);
    res.render('collection', { description, formattedArtWork });
}));

// Robots.txt for SEO
router.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send('User-agent: *\nAllow: /');
});

// Sitemap for SEO
router.get('/sitemap.xml', catchAsync(async (req, res) => {
    const collections = await CollectionSchema.find({});
    const urls = collections.map(collection => `/collection/${collection.collectionName}`);
    const sitemaps = await buildSitemaps(['/', '/about', '/contact'].concat(urls), 'https://hummingsang.com');
    res.header('Content-Type', 'application/xml');
    res.send(sitemaps['/sitemap.xml']);
}));

module.exports = router;

const factory = require('../../factory/factory')
const ArtWorkSchema = require('../../models/artworkSchema');
const DescriptionSchema = require('../../models/descriptionSchema');

test('create artwork with thumbnail id, image id, file name, is horizontal, order', () => {
    const createArtworkSchema = new ArtWorkSchema({
        thumbnailId: 123,
        imageId: 321,
        fileName: "Some File Name",
        isHorizontal: true,
        order: 1,
        createDate: new Date()
    })
    const generateArtworkSchema = factory.createArtwork(
        createArtworkSchema.thumbnailId,
        createArtworkSchema.imageId,
        createArtworkSchema.fileName,
        createArtworkSchema.isHorizontal,
        createArtworkSchema.order)

    expect(generateArtworkSchema.thumbnailId).toBe(createArtworkSchema.thumbnailId)
    expect(generateArtworkSchema.imageId).toBe(createArtworkSchema.imageId)
    expect(generateArtworkSchema.fileName).toBe(createArtworkSchema.fileName)
    expect(generateArtworkSchema.isHorizontal).toBe(createArtworkSchema.isHorizontal)
    expect(generateArtworkSchema.order).toBe(createArtworkSchema.order)
    expect(generateArtworkSchema.createDate.Date).toBe(new Date().Date)
})

test('create description with title, description, category, order', () => {
    const descriptionSchema = new DescriptionSchema({
        title: "Some Title",
        description: "Some Description",
        category: "Some Category",
        order: 1
    })
    const generateDescriptionSchema = factory.createDescription("Some Title", "Some Description", "Some Category", 1)
    expect(generateDescriptionSchema.title).toBe(descriptionSchema.title)
    expect(generateDescriptionSchema.category).toBe(descriptionSchema.category)
    expect(generateDescriptionSchema.description).toBe(descriptionSchema.description)
    expect(generateDescriptionSchema.order).toBe(descriptionSchema.order)
})
const collectionController = require('../../controllers/collectionController');
const CollectionSchema = require('../../models/collectionSchema');
const ArtWorkSchema = require('../../models/artworkSchema');
const DescriptionSchema = require('../../models/descriptionSchema');

// Mock dependencies
jest.mock('../../models/collectionSchema');
jest.mock('../../models/artworkSchema');
jest.mock('../../models/descriptionSchema');
jest.mock('../../utils/googleDriveUtil');
jest.mock('../../utils/formatArtwork');
jest.mock('../../utils/uploadCleanup');

describe('Collection Controller', () => {
    let mockReq, mockRes;

    beforeEach(() => {
        jest.clearAllMocks();
        mockReq = {
            body: {},
            params: {},
            files: {},
            flash: jest.fn()
        };
        mockRes = {
            render: jest.fn(),
            redirect: jest.fn(),
            status: jest.fn().mockReturnThis()
        };
    });


    describe('deleteArtwork()', () => {
        it('should delete artwork and flash success message', async () => {
            mockReq.params.artworkId = 'artwork1';

            const mockArtwork = {
                _id: 'artwork1',
                fileName: 'test.jpg',
                order: 0,
                thumbnailId: 'thumb1',
                imageId: 'img1',
                collectionSchema: {
                    _id: 'collection1',
                    collectionName: 'TestCollection'
                }
            };

            ArtWorkSchema.findOne = jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockArtwork)
            });

            ArtWorkSchema.deleteOne = jest.fn().mockResolvedValue({});
            ArtWorkSchema.countDocuments = jest.fn().mockResolvedValue(2);
            ArtWorkSchema.findOneAndUpdate = jest.fn().mockResolvedValue({});
            CollectionSchema.findOneAndUpdate = jest.fn().mockResolvedValue({});

            await collectionController.deleteArtwork(mockReq, mockRes);

            expect(ArtWorkSchema.deleteOne).toHaveBeenCalledWith({ _id: 'artwork1' });
            expect(mockReq.flash).toHaveBeenCalledWith('success', expect.stringContaining('Remove'));
            expect(mockRes.redirect).toHaveBeenCalledWith('/admin/collection/TestCollection');
        });

        it('should reorder remaining artworks after deletion', async () => {
            mockReq.params.artworkId = 'artwork1';

            const mockArtwork = {
                _id: 'artwork1',
                fileName: 'test.jpg',
                order: 1,
                thumbnailId: 'thumb1',
                imageId: 'img1',
                collectionSchema: {
                    _id: 'collection1',
                    collectionName: 'TestCollection'
                }
            };

            ArtWorkSchema.findOne = jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockArtwork)
            });

            ArtWorkSchema.deleteOne = jest.fn().mockResolvedValue({});
            ArtWorkSchema.countDocuments = jest.fn().mockResolvedValue(3);
            ArtWorkSchema.findOneAndUpdate = jest.fn().mockResolvedValue({});
            CollectionSchema.findOneAndUpdate = jest.fn().mockResolvedValue({});

            await collectionController.deleteArtwork(mockReq, mockRes);

            // Should reorder artworks with order greater than deleted one
            expect(ArtWorkSchema.findOneAndUpdate).toHaveBeenCalledWith(
                { collectionSchema: 'collection1', order: 2 },
                { $set: { order: 1 } }
            );
        });
    });

    describe('update()', () => {
        it('should update collection description', async () => {
            mockReq.params = { collectionId: 'col1', collectionName: 'TestCollection' };
            mockReq.body = { title: 'New Title', description: 'New Description' };

            const mockCollection = {
                _id: 'col1',
                description: { _id: 'd1' },
                cover: { thumbnailId: 'thumb1', imageId: 'img1', _id: 'cover1' }
            };

            CollectionSchema.findOne = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(mockCollection)
                })
            });

            DescriptionSchema.findOneAndUpdate = jest.fn().mockResolvedValue({});

            await collectionController.update(mockReq, mockRes);

            expect(DescriptionSchema.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: 'd1' },
                { $set: { title: 'New Title', description: 'New Description' } }
            );
            expect(mockRes.redirect).toHaveBeenCalledWith('/admin/collection/TestCollection');
        });

        it('should reorder images when order string provided', async () => {
            mockReq.params = { collectionId: 'col1', collectionName: 'TestCollection' };
            mockReq.body = { 
                title: 'Title',
                description: 'Desc',
                orders: 'img1.jpg,img2.jpg'
            };

            const mockCollection = {
                _id: 'col1',
                description: { _id: 'd1' },
                cover: { thumbnailId: 'thumb1', imageId: 'img1', _id: 'cover1' }
            };

            CollectionSchema.findOne = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(mockCollection)
                })
            });

            DescriptionSchema.findOneAndUpdate = jest.fn().mockResolvedValue({});
            ArtWorkSchema.findOneAndUpdate = jest.fn().mockResolvedValue({});

            await collectionController.update(mockReq, mockRes);

            expect(ArtWorkSchema.findOneAndUpdate).toHaveBeenCalled();
        });
    });
});

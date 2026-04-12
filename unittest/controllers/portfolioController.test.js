const portfolioController = require('../../controllers/portfolioController');
const CollectionSchema = require('../../models/collectionSchema');
const ArtWorkSchema = require('../../models/artworkSchema');

// Mock dependencies - only mock what we need
jest.mock('../../models/collectionSchema');
jest.mock('../../models/artworkSchema');
jest.mock('../../utils/googleDriveUtil');
jest.mock('../../utils/formatArtwork');

describe('Portfolio Controller', () => {
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

    describe('reorder()', () => {
        it('should reorder collections by provided order', async () => {
            mockReq.body.orders = 'Collection1,Collection2,Collection3';

            CollectionSchema.findOneAndUpdate = jest.fn().mockResolvedValue({});
            mockRes.redirect = jest.fn();

            await portfolioController.reorder(mockReq, mockRes);

            expect(CollectionSchema.findOneAndUpdate).toHaveBeenCalledTimes(3);
            expect(mockRes.redirect).toHaveBeenCalledWith('/admin/portfolio');
        });

        it('should set correct order values (highest to lowest)', async () => {
            mockReq.body.orders = 'Col1,Col2';

            CollectionSchema.findOneAndUpdate = jest.fn().mockResolvedValue({});

            await portfolioController.reorder(mockReq, mockRes);

            // First collection gets higher order value
            expect(CollectionSchema.findOneAndUpdate).toHaveBeenNthCalledWith(
                1,
                { collectionName: 'Col1' },
                { $set: { order: 1 } }
            );

            // Second collection gets lower order value
            expect(CollectionSchema.findOneAndUpdate).toHaveBeenNthCalledWith(
                2,
                { collectionName: 'Col2' },
                { $set: { order: 0 } }
            );
        });
    });

    describe('hide()', () => {
        it('should hide a collection with order -1', async () => {
            mockReq.params = { isHide: 'true', collectionName: 'TestCollection' };

            const mockCollection = { _id: '1', order: 2 };
            CollectionSchema.findOne = jest.fn().mockResolvedValue(mockCollection);
            CollectionSchema.findOneAndUpdate = jest.fn().mockResolvedValue({});
            CollectionSchema.find = jest.fn().mockResolvedValue([]);

            mockRes.redirect = jest.fn();

            await portfolioController.hide(mockReq, mockRes);

            expect(CollectionSchema.findOneAndUpdate).toHaveBeenCalledWith(
                { collectionName: 'TestCollection' },
                { $set: { isHide: true, order: -1 } }
            );
            expect(mockRes.redirect).toHaveBeenCalledWith('/admin/portfolio');
        });

        it('should unhide a collection and set correct order', async () => {
            mockReq.params = { isHide: 'false', collectionName: 'TestCollection' };

            const mockCollection = { _id: '1', order: 1 };
            CollectionSchema.findOne = jest.fn().mockResolvedValue(mockCollection);
            CollectionSchema.countDocuments = jest.fn().mockResolvedValue(3);
            CollectionSchema.findOneAndUpdate = jest.fn().mockResolvedValue({});

            await portfolioController.hide(mockReq, mockRes);

            expect(CollectionSchema.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: '1' },
                { $set: { isHide: false, order: 3 } }
            );
        });
    });
});

const aboutController = require('../../controllers/aboutController');
const DescriptionSchema = require('../../models/descriptionSchema');
const { createDescription } = require('../../factory/factory');
const { zip } = require('../../utils/zip');

// Mock dependencies
jest.mock('../../models/descriptionSchema');
jest.mock('../../factory/factory');
jest.mock('../../utils/zip');

describe('About Controller', () => {
    let mockReq, mockRes;

    beforeEach(() => {
        jest.clearAllMocks();
        mockReq = {
            body: {},
            flash: jest.fn()
        };
        mockRes = {
            render: jest.fn(),
            redirect: jest.fn(),
            status: jest.fn().mockReturnThis()
        };
    });

    describe('show()', () => {
        it('should render about page with CV descriptions', async () => {
            const mockDescriptions = [
                { _id: '1', category: 'CV', title: 'Education', description: 'Description 1', order: 0 },
                { _id: '2', category: 'CV', title: 'Experience', description: 'Description 2', order: 1 }
            ];

            DescriptionSchema.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockDescriptions)
            });

            await aboutController.show(mockReq, mockRes);

            expect(DescriptionSchema.find).toHaveBeenCalledWith({ category: 'CV' });
            expect(mockRes.render).toHaveBeenCalledWith(
                'admin/edit-about',
                { descriptions: mockDescriptions, admin: true }
            );
        });

        it('should sort descriptions by order', async () => {
            DescriptionSchema.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue([])
            });

            await aboutController.show(mockReq, mockRes);

            expect(DescriptionSchema.find).toHaveBeenCalled();
            expect(mockRes.render).toHaveBeenCalled();
        });
    });

    describe('update()', () => {
        it('should save updated CV descriptions', async () => {
            mockReq.body = {
                title: ['Education', 'Experience'],
                description: ['Studied at...', 'Worked at...']
            };

            zip.mockReturnValue([
                ['Education', 'Studied at...'],
                ['Experience', 'Worked at...']
            ]);

            DescriptionSchema.deleteMany = jest.fn().mockResolvedValue({});
            const mockDescription = { save: jest.fn().mockResolvedValue({}) };
            createDescription.mockReturnValue(mockDescription);

            await aboutController.update(mockReq, mockRes);

            expect(DescriptionSchema.deleteMany).toHaveBeenCalledWith({ category: 'CV' });
            expect(createDescription).toHaveBeenCalledTimes(2);
            expect(createDescription).toHaveBeenNthCalledWith(1, 'Education', 'Studied at...', 'CV', 0);
            expect(createDescription).toHaveBeenNthCalledWith(2, 'Experience', 'Worked at...', 'CV', 1);
            expect(mockDescription.save).toHaveBeenCalledTimes(2);
            expect(mockRes.redirect).toHaveBeenCalledWith('/admin/about');
        });

        it('should skip empty description pairs', async () => {
            mockReq.body = {
                title: ['Education', ''],
                description: ['Studied at...', 'Empty']
            };

            zip.mockReturnValue([
                ['Education', 'Studied at...'],
                ['', 'Empty']
            ]);

            DescriptionSchema.deleteMany = jest.fn().mockResolvedValue({});
            const mockDescription = { save: jest.fn().mockResolvedValue({}) };
            createDescription.mockReturnValue(mockDescription);

            await aboutController.update(mockReq, mockRes);

            // Should only create description for non-empty pair
            expect(createDescription).toHaveBeenCalledTimes(1);
            expect(mockDescription.save).toHaveBeenCalledTimes(1);
        });

        it('should delete existing CV descriptions before saving new ones', async () => {
            mockReq.body = {
                title: ['New Title'],
                description: ['New Desc']
            };

            zip.mockReturnValue([['New Title', 'New Desc']]);

            DescriptionSchema.deleteMany = jest.fn().mockResolvedValue({});
            const mockDescription = { save: jest.fn().mockResolvedValue({}) };
            createDescription.mockReturnValue(mockDescription);

            await aboutController.update(mockReq, mockRes);

            expect(DescriptionSchema.deleteMany).toHaveBeenCalledWith({ category: 'CV' });
            expect(mockDescription.save).toHaveBeenCalled();
        });
    });
});

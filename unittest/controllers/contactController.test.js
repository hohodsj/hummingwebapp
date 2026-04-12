const contactController = require('../../controllers/contactController');
const DescriptionSchema = require('../../models/descriptionSchema');
const { createDescription } = require('../../factory/factory');
const { zip } = require('../../utils/zip');

// Mock dependencies
jest.mock('../../models/descriptionSchema');
jest.mock('../../factory/factory');
jest.mock('../../utils/zip');

describe('Contact Controller', () => {
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
        it('should render contact page with social descriptions', async () => {
            const mockDescriptions = [
                { _id: '1', category: 'Social', title: 'fa-linkedin', description: 'LinkedIn URL', order: 0 },
                { _id: '2', category: 'Social', title: 'fa-github', description: 'GitHub URL', order: 1 }
            ];

            DescriptionSchema.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockDescriptions)
            });

            await contactController.show(mockReq, mockRes);

            expect(DescriptionSchema.find).toHaveBeenCalledWith({ category: 'Social' });
            expect(mockRes.render).toHaveBeenCalledWith(
                'admin/edit-contact',
                { iconDescriptions: mockDescriptions, admin: true }
            );
        });

        it('should sort descriptions by order', async () => {
            DescriptionSchema.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue([])
            });

            await contactController.show(mockReq, mockRes);

            expect(DescriptionSchema.find).toHaveBeenCalled();
            expect(mockRes.render).toHaveBeenCalled();
        });
    });

    describe('update()', () => {
        it('should save updated social descriptions', async () => {
            mockReq.body = {
                title: ['<i class="fab fa-linkedin"></i>', '<i class="fab fa-github"></i>'],
                description: ['LinkedIn Link', 'GitHub Link']
            };

            zip.mockReturnValue([
                ['<i class="fab fa-linkedin"></i>', 'LinkedIn Link'],
                ['<i class="fab fa-github"></i>', 'GitHub Link']
            ]);

            DescriptionSchema.deleteMany = jest.fn().mockResolvedValue({});
            const mockDescription = { save: jest.fn().mockResolvedValue({}) };
            createDescription.mockReturnValue(mockDescription);

            await contactController.update(mockReq, mockRes);

            expect(DescriptionSchema.deleteMany).toHaveBeenCalledWith({ category: 'Social' });
            expect(createDescription).toHaveBeenCalledTimes(2);
            expect(mockDescription.save).toHaveBeenCalledTimes(2);
            expect(mockRes.redirect).toHaveBeenCalledWith('/admin/contact');
        });

        it('should extract icon class from HTML tags', async () => {
            mockReq.body = {
                title: ['<i class="fab fa-linkedin"></i>'],
                description: ['LinkedIn']
            };

            zip.mockReturnValue([
                ['<i class="fab fa-linkedin"></i>', 'LinkedIn']
            ]);

            DescriptionSchema.deleteMany = jest.fn().mockResolvedValue({});
            const mockDescription = { save: jest.fn().mockResolvedValue({}) };
            createDescription.mockReturnValue(mockDescription);

            await contactController.update(mockReq, mockRes);

            // The controller extracts the class name from the <i> tag
            expect(createDescription).toHaveBeenCalledWith(
                'fab fa-linkedin',
                'LinkedIn',
                'Social',
                0
            );
        });

        it('should skip empty description pairs', async () => {
            mockReq.body = {
                title: ['<i class="fab fa-linkedin"></i>', ''],
                description: ['LinkedIn', 'Empty']
            };

            zip.mockReturnValue([
                ['<i class="fab fa-linkedin"></i>', 'LinkedIn'],
                ['', 'Empty']
            ]);

            DescriptionSchema.deleteMany = jest.fn().mockResolvedValue({});
            const mockDescription = { save: jest.fn().mockResolvedValue({}) };
            createDescription.mockReturnValue(mockDescription);

            await contactController.update(mockReq, mockRes);

            // Should only create description for non-empty pair
            expect(createDescription).toHaveBeenCalledTimes(1);
            expect(mockDescription.save).toHaveBeenCalledTimes(1);
        });

        it('should handle plain text titles without HTML tags', async () => {
            mockReq.body = {
                title: ['Twitter Handle'],
                description: ['@twitter']
            };

            zip.mockReturnValue([
                ['Twitter Handle', '@twitter']
            ]);

            DescriptionSchema.deleteMany = jest.fn().mockResolvedValue({});
            const mockDescription = { save: jest.fn().mockResolvedValue({}) };
            createDescription.mockReturnValue(mockDescription);

            await contactController.update(mockReq, mockRes);

            // Should use title as-is if no HTML tags
            expect(createDescription).toHaveBeenCalledWith(
                'Twitter Handle',
                '@twitter',
                'Social',
                0
            );
        });

        it('should delete existing social descriptions before saving new ones', async () => {
            mockReq.body = {
                title: ['New Social'],
                description: ['New URL']
            };

            zip.mockReturnValue([['New Social', 'New URL']]);

            DescriptionSchema.deleteMany = jest.fn().mockResolvedValue({});
            const mockDescription = { save: jest.fn().mockResolvedValue({}) };
            createDescription.mockReturnValue(mockDescription);

            await contactController.update(mockReq, mockRes);

            expect(DescriptionSchema.deleteMany).toHaveBeenCalledWith({ category: 'Social' });
            expect(mockDescription.save).toHaveBeenCalled();
        });
    });
});

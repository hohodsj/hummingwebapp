// Mock for google/GoogleDriveService.js
module.exports = {
   saveFile: jest.fn().mockResolvedValue({
       data: { id: 'mock-drive-id-' + Math.random().toString(36).slice(2) }
   }),
   deleteFile: jest.fn().mockResolvedValue({}),
   downloadFile: jest.fn().mockResolvedValue({}),
   searchAllFiles: jest.fn().mockResolvedValue([]),
};

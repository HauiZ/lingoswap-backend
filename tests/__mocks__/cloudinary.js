// tests/__mocks__/cloudinary.js
const cloudinaryMock = {
  config: () => {},
  uploader: {
    upload: async (file, options) => {
      return {
        secure_url: 'https://res.cloudinary.com/mock-cloud/image/upload/v123456/mock-avatar.png',
        public_id: 'mock-avatar-id',
        resource_type: 'image'
      };
    },
    destroy: async (publicId) => {
      return { result: 'ok' };
    }
  }
};

export const v2 = cloudinaryMock;
export default cloudinaryMock;

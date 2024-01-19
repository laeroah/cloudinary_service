const cloudinary = require('cloudinary').v2;
const {cloudinary_config} = require('./constants');
const resourceTypeAudio = 'video';
const resourceTypeVideo = 'video';
const resourceTypeSubtitle = 'raw';

cloudinary.config(cloudinary_config);

// resource type: image, raw, video, use video for mp3
const uploadToCloudinary = (filePath, publicId, resourceType, tags = []) => {
  return cloudinary.uploader.upload(
      filePath, {public_id: publicId, tags, resource_type: resourceType});
};

module.exports = {
  uploadToCloudinary,
  resourceTypeAudio,
  resourceTypeVideo,
  resourceTypeSubtitle
};

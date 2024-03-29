const {Storage} = require('@google-cloud/storage');

const storage = new Storage();
const bucketName = 'deepstream-experiments-comfyui'
const bucket = storage.bucket(bucketName)
const mime = require('mime');
const fetch = require('node-fetch');

const generateSignedUrl = async (fileName) => {
  // These options will allow temporary read access to the file
  const options = {
    version: 'v2',  // defaults to 'v2' if missing.
    action: 'read',
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,  // 1 week
  };

  return storage.bucket(bucketName).file(fileName).getSignedUrl(options);
};

// Return the public URL after saving.
const saveToCloudStorage = (localPath, destinationPath) => {
  console.log('uploading to gcs: ' + localPath);
  const options = {
    destination: destinationPath,
  };
  return bucket.upload(localPath, options).then(() => {
    console.log(`File saved to Google Cloud Storage: gs://${bucketName}/${
        destinationPath}`);
    return generateSignedUrl(destinationPath)
  });
};

// Return the public URL after saving.
const saveDataToCloudStorage = async (fileURL, destinationPath) => {
  const response = await fetch(fileURL);

  if (!response.ok) {
    throw new Error(`Error fetching file: ${response.status}`);
  }

  // Get a ReadableStream from the response
  const contentType = response.headers.get('content-type');
  const extension = mime.getExtension(contentType);
  const readableStream = response.body;
  const destFullFilePath = `${destinationPath}/${Date.now()}.${extension}`;

  const fileStream = bucket.file(destFullFilePath).createWriteStream({
    metadata: {
      contentType: contentType  // Use the detected MIME type
    }
  });
  readableStream.pipe(fileStream);  // Pipe data to Cloud Storage

  await new Promise((resolve, reject) => {
    fileStream.on('error', reject);
    fileStream.on('finish', resolve);
  });

  console.log(`File saved to Google Cloud Storage: gs://${bucketName}/${
      destFullFilePath}`);
  return generateSignedUrl(destFullFilePath);
};

module.exports = {
  saveToCloudStorage,
  saveDataToCloudStorage
};

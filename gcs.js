const {Storage} = require('@google-cloud/storage');

const storage = new Storage();
const bucketName = 'deepstream-experiments-comfyui'
const bucket = storage.bucket(bucketName)

const generateSignedUrl = async (fileName) => {
  // These options will allow temporary read access to the file
  const options = {
    version: 'v2',  // defaults to 'v2' if missing.
    action: 'read',
    expires: Date.now() + 1000 * 60 * 60,  // one hour
  };

  // Get a v2 signed URL for the file
  // const [url] =
  //     await storage.bucket(bucketName).file(fileName).getSignedUrl(options);

  // console.log(`The signed url for ${fileName} is ${url}.`);
  // return url;

  return storage.bucket(bucketName).file(fileName).getSignedUrl(options);
};

// Return the public URL after saving.
const saveToCloudStorage = async (localPath, destinationPath) => {
  console.log("uploading to gcs: " + localPath);
  const options = {
    destination: destinationPath,
  };
  await bucket.upload(localPath, options);
  console.log(`${localPath} uploaded to ${bucketName}`);
  return generateSignedUrl(destinationPath);
}

module.exports = {
  saveToCloudStorage,
};

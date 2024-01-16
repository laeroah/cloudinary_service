const express = require('express');
const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const util = require('util');
const {saveToCloudStorage} = require('./gcs');
// const {sample_story_ssml, sample_time_points} = require('./constants');

const router = express.Router();

// Creates a client
const client = new textToSpeech.v1beta1.TextToSpeechClient();
const synthesizeVoice = async (ssml_text, fileName) => {
  // Construct the request
  const request = {
    input: {ssml: ssml_text},
    // Select the language and SSML voice gender (optional)
    voice: {languageCode: 'en-GB', ssmlGender: 'FEMALE', name: 'en-GB-Neural2-A'},
    // select the type of audio encoding
    audioConfig: {audioEncoding: 'MP3'},
    // enable timepoint
    enableTimePointing: ["SSML_MARK"]
  };

  // Performs the text-to-speech request
  const [response] = await client.synthesizeSpeech(request);
  // Write the binary audio content to a local file
  const writeFile = util.promisify(fs.writeFile);
  writeFile(fileName, response.audioContent, 'binary');
  console.log(response);
  return saveToCloudStorage(fileName, fileName);
};

// Sample call: curl -X POST -H "Content-Type: application/json" --data
// '{"text": "hello world!"}'
// http://0.0.0.0:8080/synthesize_voice
router.use('/synthesize_voice', async (req, res, next) => {
  if (req.method === 'POST') {
    const filename = Date.now() + '.mp3';  // Generate a unique filename
    if (req.body.ssml) {
      const ssml = req.body.ssml;
      synthesizeVoice(ssml, filename).then((url) => {
        res.status(201).send({
          message: 'Voice synthesized successfully!',
          filename,
          downloadUrl: url
        });
      }).catch((error) => {
        console.error('Error synthesize voice:', error);
        res.status(500).send('Error synthesize voice');
      }).finally(() => {
        fs.unlinkSync(filename);  // Clean up the local file}
      });
    } else {
      return res.status(400).send({message: 'Missing input text.'});
    }
  } else {
    next();
  }
});

module.exports = router;

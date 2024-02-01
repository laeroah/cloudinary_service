const express = require('express');
const fs = require('fs');
const fsPromise = require('fs').promises;
const {saveToCloudStorage} = require('./gcs');
const {sound_api, sound_api_key, sound_api_data} = require('./constants');

const router = express.Router();

const generateSound = (prompt, lengthSec) => {
  sound_api_data.description = prompt;
  sound_api_data.requestContext.audioLengthSeconds = lengthSec;
  return fetch(sound_api, {
    method: 'POST',
    headers:
        {'Content-Type': 'application/json', 'x-goog-api-key': sound_api_key},
    body: JSON.stringify(sound_api_data)
  })
};

const processSoundResponse = (response, fileName) => {
  for (const result of response.results) {
    const audioData = result.audioData;
    console.log(
        'audioData.audioContainer: ' +
        JSON.stringify(audioData.audioContainer));
    return fsPromise.writeFile(fileName, Buffer.from(audioData.data, 'base64'));
  }
};

router.use('/synthesize_music', async (req, res, next) => {
  if (req.method === 'POST') {
    const soundFileName = Date.now() + '_music.mp3';
    generateSound(req.body.prompt, req.body.length_sec)
        .then(response => {
          console.log('response: ' + response);
          return response.json();
        })
        .then(responseData => {
          if (responseData.error) {
            throw (responseData.error);
          }
          console.log(responseData);
          return processSoundResponse(responseData, soundFileName);
        })
        .then(() => saveToCloudStorage(soundFileName, `audio_files/${soundFileName}`))
        .then(([url]) => {
          return res.json({success: true, url});
        })
        .catch(error => {
          console.error(error);
          return res.status(500).send({
            message: 'Failed to generate music. Error: ' + JSON.stringify(error)
          });
        })
        .finally(() => {
          if (fs.existsSync(soundFileName)) {
            fs.unlink(soundFileName, ()=>{});
          }
        });
  } else {
    next();
  }
});

module.exports = router;

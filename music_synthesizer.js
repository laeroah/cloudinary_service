const express = require('express');
const fs = require('fs');
const fsPromise = require('fs').promises;
const {saveToCloudStorage} = require('./gcs');
const {sound_api, sound_api_key, sound_api_data} = require('./constants');

const router = express.Router();

const generateSound = (prompt, lengthSec = 70) => {
  sound_api_data.description = prompt;
  // This is currently ignored.
  sound_api_data.requestContext.audioLengthSeconds = lengthSec;
  // Hardcode to max 2 continuation to generate 70s sound track. Enough for short videos.
  sound_api_data.requestContext.num_continuations = 2;
  console.log("generating sound prompt: " + prompt);
  console.log("generating sound length: " + lengthSec);
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

/**
 * Synthesize music based on a prompt.
 * Returns the resulting mp3 file URL.
 * @param {String} prompt - prompt to generate music.
 */
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

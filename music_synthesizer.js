const express = require('express');
const fs = require('fs');
const {saveToCloudStorage} = require('./gcs');
const {sound_api, sound_api_key, sound_api_data} = require('./constants');

const router = express.Router();

const generateSound = (prompt, lengthSec) => {
  sound_api_data.description = prompt;
  sound_api_data.requestContext.audioLengthSeconds = lengthSec;
  return fetch(sound_api, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 'x-goog-api-key': sound_api_key
    },
    body: JSON.stringify(sound_api_data)
  })
};

const processSoundResponse = (response, fileName) => {
/*
 for i, result in enumerate(response.results):
    audio_data = result.audio_data
    extension = CONTAINER_TO_EXTENSION.get(audio_data.audio_container, '.data')
    time_suffix = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
    filename_prefix = os.path.join(
        _OUTPUT_DIR.value,
        f'audio_{time_suffix}_{request_hash}_{i}_flow_{_FLOW.value}',
    )
    filename = f'{filename_prefix}.{extension}'
    print('Writing audio to: ', filename)
    with gfile.Open(filename, mode='wb') as file:
      file.write(audio_data.data)
    tokens_filename = f'{filename_prefix}.json'
    print('Writing tokens to: ', tokens_filename)
    write_tokens_as_json(result, tokens_filename)
    */
  for (const result of response.results) {
    const audio_data = result.audio_data;
    console.log(JSON.stringify(audio_data.audio_container));
    return fs.writeFile(fileName, audio_data.data);
    // const extension = CONTAINER_TO_EXTENSION.get(audio_data.audio_container, '.data')
  }
};

router.use('/synthesize_music', async (req, res, next) => {
  if (req.method === 'POST') {
    const soundFileName = Date.now() + '_music.mp3';
    generateSound(req.body.prompt, req.body.length_sec)
        .then(response => {
          if (!response.ok) {
            throw new Error('Generate music failed: ' + response);
          }
          return response.json();
        })
        .then(responseData => {
          return processSoundResponse(responseData, fileName);
        })
        .then(() => {
          return res.json({
            success: true
          });
        })
        .catch(error => {
          console.error(error);
          return res.status(500).send({
            message: 'Failed to generate music. Error: ' + JSON.stringify(error)
          });
        });
  } else {
    next();
  }
});

module.exports = router;

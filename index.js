const express = require('express');
const fs = require('fs');
// const { app, downloadImage, uploadImage } = require('./shared');
const voiceSynthesizerRouter = require('./voice_synthesizer');
const videoSynthesizerRouter = require('./video_synthesizer');
const textToSpeech = require('@google-cloud/text-to-speech');

const speechClient = new textToSpeech.v1beta1.TextToSpeechClient();
// const helmet = require("helmet")

// const { comfyuiServerUrl, comfyuiHistoryUrl } = require('./constants');

const {GoogleAuth} = require('google-auth-library');

async function main() {
  const auth = new GoogleAuth(
      {scopes: 'https://www.googleapis.com/auth/cloud-platform'});
  const client = await auth.getClient();
  const projectId = await auth.getProjectId();
  const url =
      `https://texttospeech.googleapis.com/v1/voices`;
  const res = await client.request({url});
  console.log(res.data);
  console.log("credentials: " + JSON.stringify(auth.credentials));
  speechClient.listVoices({languageCode: 'en'});
  const [result] = await speechClient.listVoices({languageCode});
  const voices = result.voices;

  voices.forEach((voice) => {
    console.log(`${voice.name} (${voice.ssmlGender}): ${voice.languageCodes}`);
  });
}

main().catch(console.error);

const app = express();
// app.use(
//   helmet({
//     referrerPolicy: {
//       policy: ["origin", "unsafe-url"],
//     },
//   })
// );

const port = process.env.PORT || 8080;

// Middleware to handle base64-encoded images
app.use(express.json());
// Add this line to serve our index.html page
app.use(express.static('public'));

app.get('/check', (req, res) => {
  res.send('Server is healthy!!');
});

// Use the router for '/synthesize_voice'
app.use(voiceSynthesizerRouter);

// Use the router for '/synthesize_video'
app.use(videoSynthesizerRouter);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

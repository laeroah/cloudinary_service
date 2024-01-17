const express = require('express');
const fs = require('fs');
// const { app, downloadImage, uploadImage } = require('./shared');
const voiceSynthesizerRouter = require('./voice_synthesizer');
const videoSynthesizerRouter = require('./video_synthesizer');
// const helmet = require("helmet")

// const { comfyuiServerUrl, comfyuiHistoryUrl } = require('./constants');

// const {auth, Compute} = require('google-auth-library');

// async function main() {
//   const client = new Compute({
//     // Specifying the service account email is optional.
//     serviceAccountEmail:
//         'aishorts-prototyping@deepstream-experiments.iam.gserviceaccount.com'
//   });
//   const projectId = await auth.getProjectId();
//   console.log("projectId: " + projectId);
//   const url = `https://dns.googleapis.com/dns/v1/projects/${projectId}`;
//   const res = await client.request({url});
//   console.log(res.data);
// }

// main().catch(console.error);

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

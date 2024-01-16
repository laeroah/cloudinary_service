const express = require('express');
const fs = require('fs');
// const { app, downloadImage, uploadImage } = require('./shared');
const voiceSynthesizerRouter = require('./voice_synthesizer');
const videoSynthesizerRouter = require('./video_synthesizer');

// const { comfyuiServerUrl, comfyuiHistoryUrl } = require('./constants');

const app = express();
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

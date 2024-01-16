const express = require('express');
var xmlToJsonParser = require('xml2json');
const fs = require('fs');

const router = express.Router();
const {sample_story_ssml, sample_time_points} = require('./constants');
const cloudinary = require('cloudinary').v2;
const imagePublicIds = [
  'solid-color-image-1', 'solid-color-image-2', 'solid-color-image-3',
  'solid-color-image-4', 'solid-color-image-5', 'solid-color-image-6',
  'solid-color-image-7', 'solid-color-image-8', 'solid-color-image-9'
];
const tag = 'solid-color-video';

cloudinary.config({
  cloud_name: 'dgxcndjdr',
  api_key: '697581946523117',
  api_secret: '09czU54XnUfCElaxhTNg7LOnEkQ'
});

String.prototype.toSRTTimeCode =
    function() {
  var sec_num = parseInt(this, 10);  // don't forget the second param
  var sec_float =
      parseFloat(this, 10).toFixed(3);  // don't forget the second param

  var hours = Math.floor(sec_num / 3600);
  var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
  var seconds = sec_num - (hours * 3600) - (minutes * 60);
  var mseconds = sec_float > sec_num ? sec_float * 1000 - sec_num * 1000 : 0;

  hours = hours.toString().padStart(2, '0');
  minutes = minutes.toString().padStart(2, '0');
  seconds = seconds.toString().padStart(2, '0');
  mseconds = Math.floor(mseconds).toString().padStart(3, '0');
  return hours + ':' + minutes + ':' + seconds + ',' + mseconds;
}

const generateSRT =
    (ssmlStr, timePoints) => {
      console.log(ssmlStr);
      ssml = JSON.parse(xmlToJsonParser.toJson(ssmlStr));
      const subtitleFile = fs.createWriteStream('sample_subtitle.srt');
      for (const [index, mark] of ssml.speak.mark.entries()) {
        subtitleFile.write(index + 1 + '\n');
        text = mark.text;
        markName = mark.name;
        timeSeconds = timePoints[index]['timeSeconds'];
        nextTimeSeconds = index < timePoints.length - 1 ?
            timePoints[index + 1]['timeSeconds'] :
            timeSeconds + 3;
        startTime = timeSeconds.toString().toSRTTimeCode();
        endTime = nextTimeSeconds.toString().toSRTTimeCode();
        subtitleFile.write(
            `${startTime} --> ${endTime}` +
            '\n');
        subtitleFile.write(text + '\n\n');
      }
      subtitleFile.end();
    }

const createSampleVideo = async () => {
  const uploadPromises = imagePublicIds.map(publicId => {
    return cloudinary.uploader.upload(
        `sample_images/${publicId}.jpeg`, {public_id: publicId, tags: tag});
  });
  return Promise.all(uploadPromises)
      .then(result => {
        // Step 2: Use the multi method to create animated image
        return cloudinary.uploader.multi(tag, {resource_type: 'image'});
      })
      .then(result => {
        // Step 3: Deliver the animated image
        return cloudinary.url(`${tag}.gif`, {type: 'multi'});
      })
      .catch(error => {
        console.error(error);
      });
};

// Pass cloudinary asset public ids.
const overlayAudioAndText = (video_id, audio_id, subtitle_id) => {
  // generateSRT(sample_story_ssml, sample_time_points);
  const video = cloudinary.url(video_id, {
    transformation: [
      {overlay: `audio:${audio_id}`}, {flags: 'layer_apply'},
      {overlay: {resource_type: 'subtitles', public_id: subtitle_id}},
      {flags: 'layer_apply'}
    ]
  }) + '.mp4';
  console.log('overlayed video URL: ' + video);
};

router.use('/generate_sample_video', async (req, res, next) => {
  // Step 1. Overlay the video with text caption
  // Step 4. Overlay the srt
  if (req.method === 'GET') {
    overlayAudioAndText(
        'solid-color-video-49-seconds_ohqqko_jmuva8', 'kjilkyps2iqyspxjv6kt',
        'sample_subtitle_mw5cij.srt');
    res.status(201).send({message: 'Sample video synthesized successfully!'});
  } else {
    next();
  }
});

router.use('/synthesize_video', async (req, res, next) => {
  // Step 1. Create a gif
  // Step 2. Convert gif to mp4
  // Step 3. Overlay the video with text caption
  // Step 4. Upload the video
  if (req.method === 'GET') {
    try {
      createSampleVideo().then((videoUrl) => {
        res.status(201).send({
          message: 'Sample video synthesized successfully!',
          downloadUrl: videoUrl
        });
      });
    } catch (error) {
      console.error(error);
      return res.status(500).send({message: 'Sample video synthesize failed.'});
    }
  } else {
    next();
  }
});

module.exports = router;

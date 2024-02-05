const express = require('express');
const fs = require('fs');
const {saveDataToCloudStorage} = require('./gcs');
const {gcsComfyUIOutputVideoFolder} = require('./constants');

const router = express.Router();
const {
  sample_story_ssml,
  sample_time_points,
  animate_durations,
  cloudinary_config,
  overlay_effect
} = require('./constants');
const cloudinary = require('cloudinary').v2;
const {
  uploadToCloudinary,
  resourceTypeAudio,
  resourceTypeVideo,
  resourceTypeSubtitle
} = require('./cloudinary');
const imagePublicIds = [
  'solid-color-image-1', 'solid-color-image-2', 'solid-color-image-3',
  'solid-color-image-4', 'solid-color-image-5', 'solid-color-image-6',
  'solid-color-image-7', 'solid-color-image-8', 'solid-color-image-9'
];
const tag = 'sample-story-video';

const imageHeight = 904;
const imageWidth = 512;

// Sample story data
const sampleStoryName = 'sample_story_1'
const imagePublicIds_sample_story = [
  sampleStoryName + '_1', sampleStoryName + '_2', sampleStoryName + '_3',
  sampleStoryName + '_4', sampleStoryName + '_5', sampleStoryName + '_6',
  sampleStoryName + '_7', sampleStoryName + '_8'
];
const sampleStoryImageTag = sampleStoryName + '-tag'

cloudinary.config(cloudinary_config);

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
  const videoUrl = cloudinary.url(video_id, {
    resource_type: 'video',
    transformation: [
      // cloudinary adds .mp3 to public id of mp3.
      {overlay: {resource_type: 'audio', public_id: audio_id + '.mp3'}},
      {flags: 'layer_apply'}, {
        overlay: {
          // all google fonts are supported
          font_family: 'bangers',
          font_size: 40,
          resource_type: 'subtitles',
          public_id: subtitle_id
        }
      },
      {flags: 'layer_apply', gravity: 'center'}
    ]
  }) + '.mp4';
  console.log('overlayed video URL: ' + videoUrl);
  return videoUrl;
};

const applyAnimationToImages = (imagePublicIds, animate_durations) => {
  return imagePublicIds.map((publicId, index) => {
    const du = animate_durations[index];
    const mode = Math.random() < 0.5 ? 'mode_ofr' : '';
    const url = cloudinary.url(publicId, {
      resource_type: 'image',
      transformation: [
        {effect: `zoompan:${mode};du_${du};to_(g_auto);fps_30`},
        {width: 400, crop: 'scale'}, {quality: 'auto'}
      ]
    }) + '.mp4';
    console.log('animated image url: ' + url + '\n');
    return url;
  });
};

const applyOverlayToImage = (overlayId, videoId) => {
  console.log('overlay id: ' + overlayId + '\n');
  const url = cloudinary.url(videoId, {
    resource_type: 'video',
    transformation: [
      {overlay: overlayId, opacity: 50},
      {width: 512, height: 904, crop: 'scale'}, {flags: 'layer_apply'}
    ]
  }) + '.mp4';
  console.log('overlay applied image url: ' + url + '\n');
  return url;
};

const concatVideos = (videoPublicIds) => {
  const videoHeight = imageHeight;
  const videoWidth = imageWidth;
  const totalVideoCount = videoPublicIds.length;
  var transformation = [{height: videoHeight, width: videoWidth, crop: 'fill'}];
  for (let i = 1; i < totalVideoCount; i++) {
    transformation.push(
        {flags: 'splice', overlay: `video:${videoPublicIds[i]}`});
    transformation.push(
        {height: videoHeight, width: videoWidth, crop: 'fill'},
        {flags: 'layer_apply'});
  }
  const url = cloudinary.url(
      `${videoPublicIds[0]}.mp4`, {resource_type: 'video', transformation});
  console.log('concat video: ' + url + '\n');
  return url;
};

// https://res.cloudinary.com/dgxcndjdr/video/upload/l_audio:sample_story_1/sample_story_1.mp3/fl_layer_apply/l_subtitles:sample_story_1:sample_story_1.srt/fl_layer_apply/v1/sample_story_1/sample_story_1_concat.mp4
// https://res.cloudinary.com/dgxcndjdr/video/upload/l_subtitles:sample_story_1:sample_story_1.srt/fl_layer_apply/v1/sample_story_1/sample_story_1_concat.mp4
// https://res.cloudinary.com/dgxcndjdr/video/upload/l_audio:sample_story_1:sample_story_1.mp3/fl_layer_apply/v1/sample_story_1/sample_story_1_concat.mp4
// https://res.cloudinary.com/dgxcndjdr/video/upload/l_audio:1705467727438.mp3/fl_layer_apply/l_subtitles:anton_30:1705467727438_subtitle.srt/fl_layer_apply,g_center/1705500583066_concat_video
// https://res.cloudinary.com/dgxcndjdr/video/upload/l_audio:sample_story_1/fl_layer_apply/l_subtitles:anton_30:sample_story_1:sample_story_1.srt/fl_layer_apply,g_center/v1/sample_story_1/sample_story_1_concat

router.use('/overlay_audio_and_text', async (req, res, next) => {
  // Step 1. Overlay the video with text caption
  // Step 4. Overlay the srt
  if (req.method === 'GET') {
    const storyName = req.body.story_name;
    overlayAudioAndText(
        '1705500583066_concat_video', '1705467727438.mp3.mp3',
        '1705467727438_subtitle.srt');
    res.status(201).send({message: 'Sample video synthesized successfully!'});
  } else {
    next();
  }
});

/* Sample call:
curl -X POST -H "Content-Type: application/json" --data \
'{"video_url":"https://res.cloudinary.com/dgxcndjdr/video/upload/v1706569639/1706569620812_concat_video.mp4","effect_name":"cherry_petals"}'
\ http://0.0.0.0:8080/overlay_effect
*/
router.use('/overlay_effect', async (req, res, next) => {
  if (req.method === 'POST') {
    const videoUrl = req.body.video_url;
    const effectName = req.body.effect_name;
    if (effectName && !overlay_effect.hasOwnProperty(effectName)) {
      return res.status(400).send(
          {message: `No effect name ${effectName} found.`});
    }
    const videoId = Date.now() + '_effect_overlay_video_base';
    uploadToCloudinary(videoUrl, videoId, 'video')
        .then(() => {
          const cloudinaryUrl = applyOverlayToImage(
              overlay_effect.getCloudinaryPublicIdFromName(effectName),
              videoId);
          return saveDataToCloudStorage(
              cloudinaryUrl, gcsComfyUIOutputVideoFolder);
        })
        .then(([finalVideoUrl]) => {
          res.status(201).send(
              {message: 'add overlay successfully!', finalVideoUrl});
        })
        .catch(error => {
          console.error(error);
          return res.status(400).send({
            message: 'Failed to add overlay. Error: ' + JSON.stringify(error)
          });
        });
  } else {
    next();
  }
});

/* Sample call:
curl -X POST -H "Content-Type: application/json" --data \
'{"story_images":["https://res.cloudinary.com/dgxcndjdr/image/upload/v1705428955/sample_story_1_1.jpg","https://res.cloudinary.com/dgxcndjdr/image/upload/v1705428955/sample_story_1_2.jpg"],
"durations":[6.2, 5.2], "audio":"1705467727438.mp3",
"subtitle":"1705467727438_subtitle.srt"}' \ http://0.0.0.0:8080/synthesize_video
*/
router.use('/synthesize_video', async (req, res, next) => {
  // Step 1. upload all images to cloudinary
  // Step 2. apply Ken Burns effect on all images to generate videos
  // Step 3. upload the generated videos
  // Step 4. concat videos into a single video
  // Step 5. Adds audio and text caption overlay
  if (req.method === 'POST') {
    const storyImageUrls = req.body.story_images;
    const nameBase = Date.now();
    const tag = nameBase + '_tag';
    let publicIdBase = nameBase + '_story_image';
    const concatVideoId = nameBase + '_concat_video';
    let imagePublicIds = [];
    let videoPublicIds = [];
    const uploadImagePromises = storyImageUrls.map((imageUrl, index) => {
      const publicId = `${publicIdBase}_${index}`;
      imagePublicIds.push(publicId);
      return uploadToCloudinary(
          imageUrl, `${publicIdBase}_${index}`, 'image', tag);
    });
    return Promise.all(uploadImagePromises)
        .then(() => {
          // create and upload individual scenes
          const animatedImageUrls =
              applyAnimationToImages(imagePublicIds, req.body.durations);
          publicIdBase = Date.now() + '_story_video';
          const uploadVideoPromises =
              animatedImageUrls.map((videoUrl, index) => {
                const publicId = `${publicIdBase}_${index}`;
                videoPublicIds.push(publicId);
                return uploadToCloudinary(
                    videoUrl, `${publicIdBase}_${index}`, 'video', tag);
              });
          return Promise.all(uploadVideoPromises);
        })
        .then(() => {
          // create and upload concatnated video
          const videoUrl = concatVideos(videoPublicIds);
          return uploadToCloudinary(videoUrl, concatVideoId, 'video');
        })
        .then(() => {
          // overlay audio and text
          const cloudinaryUrl = overlayAudioAndText(
              concatVideoId, req.body.audio, req.body.subtitle);
          return saveDataToCloudStorage(
              cloudinaryUrl, gcsComfyUIOutputVideoFolder);
        })
        .then(([finalVideoUrl]) => {
          res.status(201).send(
              {message: 'synthsize video successfully!', finalVideoUrl});
        })
        .catch(error => {
          console.error(error);
          return res.status(400).send({
            message:
                'Failed to synthsize video. Error: ' + JSON.stringify(error)
          });
        });
  } else {
    next();
  }
});

router.use('/upload_images', async (req, res, next) => {
  if (req.method === 'GET') {
    const uploadPromises = imagePublicIds_sample_story.map(publicId => {
      return cloudinary.uploader.upload(
          `data_files/story_images/${sampleStoryName}/${publicId}.jpeg`,
          {public_id: publicId, tags: sampleStoryImageTag});
    });
    return Promise.all(uploadPromises)
        .then(() => {
          res.status(201).send({message: 'image updated successfully!'});
        })
        .catch(error => {
          console.error(error);
          return res.status(400).send(
              {message: 'Failed to upload images. Error: ' + error});
        });
  } else {
    next();
  }
});

router.use('/apply_zoom_pan_images', async (req, res, next) => {
  if (req.method === 'GET') {
    const animated_image_urls =
        imagePublicIds_sample_story.map((publicId, index) => {
          const du = animate_durations[index];
          const url = cloudinary.url(publicId, {
            resource_type: 'image',
            transformation: [
              {effect: `zoompan:du_${du};to_(g_auto)`},
              {width: imageWidth, crop: 'scale'}, {quality: 'auto'}
            ]
          });
          console.log(
              url + '.mp4' +
              '\n');
          return url;
        });
    res.status(200).send({message: 'zoom pan animated apply successfully!'});
  } else {
    next();
  }
});

router.use('/concat_videos', async (req, res, next) => {
  if (req.method === 'POST') {
    const storyName = req.body.story_name;
    const videoHeight = imageHeight;
    const videoWidth = imageWidth;
    const totalVideoCount = imagePublicIds_sample_story.length;
    var transformation =
        [{height: videoHeight, width: videoWidth, crop: 'fill'}];
    for (let i = 1; i < totalVideoCount; i++) {
      transformation.push({
        flags: 'splice',
        overlay: `video:${storyName}:${imagePublicIds_sample_story[i]}`
      });
      transformation.push(
          {height: videoHeight, width: videoWidth, crop: 'fill'},
          {flags: 'layer_apply'});
    }
    const url = cloudinary.url(
        `${storyName}/${imagePublicIds_sample_story[0]}.mp4`,
        {resource_type: 'video', transformation});
    console.log('concat video: ' + url + '\n');
    res.status(200).send({message: 'concat videos successfully!'});
  } else {
    next();
  }
});

// clang-format off
/* Sample call:
curl -X POST -H "Content-Type: application/json" --data \
'{"sound_url":url, "video_url":url, "start_offset_sec": 2.2, "duration": 3}' \
http://0.0.0.0:8080/add_sound_to_video
*/
// clang-format on
router.use('/add_sound_to_video', async (req, res, next) => {
  if (req.method === 'POST') {
    const soundUrl = req.body.sound_url;
    const videoUrl = req.body.video_url;
    const start_offset = req.body.start_offset_sec;
    const duration = req.body.duration;
    const soundCloudinaryId = Date.now() + 'sound_file';
    const videoCloudinaryId = Date.now() + 'video_file';
    var uploads = [];
    uploads.push(
        uploadToCloudinary(soundUrl, soundCloudinaryId, resourceTypeAudio));
    uploads.push(
        uploadToCloudinary(videoUrl, videoCloudinaryId, resourceTypeVideo));
    Promise.all(uploads)
        .then(() => {
          var transformation = [
            {
              overlay: {
                resource_type: 'audio',
                public_id: soundCloudinaryId + '.mp3'
              }
            },
            {effect: 'volume:-80'}
          ];
          transformation.push({flags: 'layer_apply', duration, start_offset});
          const url = cloudinary.url(
                          videoCloudinaryId,
                          {resource_type: resourceTypeVideo, transformation}) +
              '.mp4';
          console.log('url: ' + url + '\n');
          res.status(200).send({message: 'success', url});
        })
        .catch(error => {
          console.error(error);
          return res.status(500).send(
              {message: 'Failed to add sound to video. Error: ' + error});
        });
  } else {
    next();
  }
});

module.exports = router;

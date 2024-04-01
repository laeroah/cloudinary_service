const express = require('express');
const fs = require('fs');
const {saveDataToCloudStorage} = require('./gcs');
const {gcsComfyUIOutputVideoFolder, gcsOutputVideoFolder} =
    require('./constants');

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
  resourceTypeImage,
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
const landscapeVideoDimention = {
  width: 904,
  height: 512
};
const portraitVideoDimention = {
  width: 512,
  height: 904
};

// Sample story data
const sampleStoryName = 'sample_story_1'
const imagePublicIds_sample_story = [
  sampleStoryName + '_1', sampleStoryName + '_2', sampleStoryName + '_3',
  sampleStoryName + '_4', sampleStoryName + '_5', sampleStoryName + '_6',
  sampleStoryName + '_7', sampleStoryName + '_8'
];
const sampleStoryImageTag = sampleStoryName + '-tag'

cloudinary.config(cloudinary_config);

// Pass cloudinary asset public ids.
const overlayAudioAndText =
    (video_id, audio_id, subtitle_id, gravity = 'center') => {
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
          {flags: 'layer_apply', gravity}
        ]
      }) + '.mp4';
      console.log('overlayed video URL: ' + videoUrl);
      return videoUrl;
    };

const overlayTimeCaption = (video_id, subtitle_id, font_family = 'bangers') => {
  subtitle_id =
      subtitle_id.endsWith('.srt') ? subtitle_id : `${subtitle_id}.srt`;
  const videoUrl = cloudinary.url(video_id, {
    resource_type: 'video',
    transformation: [
      {
        overlay: {
          // all google fonts are supported
          font_family: font_family,
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
        {crop: 'scale'}, {quality: 'auto'}
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

const concatVideos =
    (videoPublicIds, orientation = 'portrait', durations = []) => {
      const {videoWidth, videoHeight} = orientation == 'portrait' ?
          portraitVideoDimention :
          landscapeVideoDimention;
      const totalVideoCount = videoPublicIds.length;
      var transformation = durations && durations[0] ?
          [{height: videoHeight, width: videoWidth, crop: 'fill'}] :
          [{
            height: videoHeight,
            width: videoWidth,
            crop: 'fill',
            duration: durations[0]
          }];
      for (let i = 1; i < totalVideoCount; i++) {
        transformation.push(
            {flags: 'splice', overlay: `video:${videoPublicIds[i]}`});
        if (durations && durations[i]) {
          transformation.push({duration: durations[i]});
        }
        transformation.push(
            {height: videoHeight, width: videoWidth, crop: 'fill'},
            {flags: 'layer_apply'});
      }
      const url = cloudinary.url(
          `${videoPublicIds[0]}.mp4`, {resource_type: 'video', transformation});
      console.log('concat video: ' + url + '\n');
      return url;
    };

const publicIdBase = (prefix) => {
  const nameBase = Date.now();
  return `${prefix}_${nameBase}`;
};

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

/**
 * Adds camera motion to an image. Currently only zoompan effect is supported.
 * Returns the resulting video URL.
 * @param {String} image_url - url of the image to add camera motion to.
 * @param {Float} length - the length of the motion.
 */
router.use('/image/camera_motion', async (req, res, next) => {
  // clang-format off
  /* Sample call:
  curl -X POST -H "Content-Type: application/json" --data \
  '{"image_url":"https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Image_created_with_a_mobile_phone.png/1920px-Image_created_with_a_mobile_phone.png","length": 3.2}' \
  http://0.0.0.0:8080/image/camera_motion
  */
  // clang-format on
  if (req.method === 'POST') {
    const imageUrl = req.body.image_url;
    const length = req.body.length;
    if (imageUrl && length) {
      const imagePublicId = publicIdBase('image');
      uploadToCloudinary(imageUrl, imagePublicId, resourceTypeImage)
          .then(() => {
            const [animatedImageUrl] =
                applyAnimationToImages([imagePublicId], [length]);
            return saveDataToCloudStorage(
                animatedImageUrl, gcsOutputVideoFolder);
          })
          .then(([url]) => {
            return res.json({success: true, url});
          })
          .catch(error => {
            console.error(error);
            return res.status(500).send({
              message: 'Failed to add motion to image. Error: ' +
                  JSON.stringify(error)
            });
          });
    } else {
      return res.status(500).send({
        message:
            'Failed to add motion to video. Error: missing input image_url or length.'
      });
    }
  } else {
    next();
  }
});

/**
 * Adds timed caption to a video.
 * Returns the resulting video URL.
 * @param {String} video_url - url of the video to add caption overlay to.
 * @param {String} caption_url - caption file (.srt) file URL.
 * @param {String} font_family - font family of the subtitle. All google fonts
 *     are supported. Default is `bangers`
 */
router.use('/video/caption', async (req, res, next) => {
  // clang-format off
  /* Sample call:
  curl -X POST -H "Content-Type: application/json" --data \
  '{"video_url":"http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4","caption_url": "https://res.cloudinary.com/dgxcndjdr/raw/upload/v1707230885/1707230883740_subtitle.srt"}' \
  http://0.0.0.0:8080/video/caption
  */
  // clang-format on
  if (req.method === 'POST') {
    const videoUrl = req.body.video_url;
    const captionUrl = req.body.caption_url;
    const fontFamily = req.body.font_family || 'bangers';
    if (videoUrl && captionUrl) {
      const videoPublicId = publicIdBase('video');
      const captionPublicId = publicIdBase('caption');
      uploadToCloudinary(videoUrl, videoPublicId, resourceTypeVideo)
          .then(() => {
            return uploadToCloudinary(
                captionUrl, captionPublicId, resourceTypeSubtitle);
          })
          .then(() => {
            const cloudinaryUrl =
                overlayTimeCaption(videoPublicId, captionPublicId, fontFamily);
            return saveDataToCloudStorage(cloudinaryUrl, gcsOutputVideoFolder);
          })
          .then(([url]) => {
            return res.json({success: true, url});
          })
          .catch(error => {
            console.error(error);
            return res.status(400).send({
              message: 'Failed to add caption to video. Error: ' +
                  JSON.stringify(error)
            });
          });
    } else {
      return res.status(500).send({
        message:
            'Failed to add caption to video. Error: missing input video_url or caption_url.'
      });
    }
  } else {
    next();
  }
});

/**
 * Concatenate multiple videos into a single video.
 * Returns the resulting video URL.
 * @param {Array} video_urls - array of URLs of videos to concatenate.
 */
router.use('/video/concat', async (req, res, next) => {
  // clang-format off
  /* Sample call:
  curl -X POST -H "Content-Type: application/json" \
  -d '{"video_urls":["http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4","http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"]}' \
  http://0.0.0.0:8080/video/concat
  */
  // clang-format on
  if (req.method === 'POST') {
    const videoUrls = req.body.video_urls;
    if (!videoUrls) {
      return res.status(500).send({
        message: 'Failed to concat videos. Error: missing input video_urls.'
      });
    }
    let videoPublicIds = [];
    const uploadVideoPromises = videoUrls.map((videoUrl, index) => {
      const publicId = publicIdBase(`concat_${index}`);
      videoPublicIds.push(publicId);
      return uploadToCloudinary(videoUrl, publicId, resourceTypeVideo);
    });
    Promise.all(uploadVideoPromises)
        .then(() => {
          const durations = req.body.durations || [];
          const orientation = req.body.orientation || 'portrait';
          const videoUrl = concatVideos(videoPublicIds, orientation, durations);
          return saveDataToCloudStorage(videoUrl, gcsOutputVideoFolder);
        })
        .then(([url]) => {
          return res.json({success: true, url});
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


/* Sample call:
curl -X POST -H "Content-Type: application/json" --data \
'{"story_images":["https://res.cloudinary.com/dgxcndjdr/image/upload/v1705428955/sample_story_1_1.jpg","https://res.cloudinary.com/dgxcndjdr/image/upload/v1705428955/sample_story_1_2.jpg"],
"durations":[6.2, 5.2], "audio":"1705467727438.mp3",
"subtitle":"1705467727438_subtitle.srt"}' \
http://0.0.0.0:8080/synthesize_video
*/
router.use('/synthesize_video', async (req, res, next) => {
  // Step 1. upload all images to cloudinary
  // Step 2. apply Ken Burns effect on all images to generate videos
  // Step 3. upload the generated videos
  // Step 4. concat videos into a single video
  // Step 5. Adds audio and text caption overlay
  if (req.method === 'POST') {
    const storyImageUrls = req.body.story_images;
    const textOverlayGravity = req.body.text_overlay_gravity || 'center';
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
          const orientation = req.body.orientation || 'portrait';
          const videoUrl = concatVideos(videoPublicIds, orientation);
          return uploadToCloudinary(videoUrl, concatVideoId, 'video');
        })
        .then(() => {
          // overlay audio and text
          const cloudinaryUrl = overlayAudioAndText(
              concatVideoId, req.body.audio, req.body.subtitle,
              textOverlayGravity);
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

// clang-format off
/* Sample call:
curl -X POST -H "Content-Type: application/json" --data \
'{"sound_url":url, "video_url":url, "start_offset_sec": 2.2, "duration": 3}' \
http://0.0.0.0:8080/video/sound
*/
// clang-format on
router.use('/video/sound', async (req, res, next) => {
  if (req.method === 'POST') {
    const soundUrl = req.body.sound_url;
    const videoUrl = req.body.video_url;
    const start_offset = req.body.start_offset_sec;
    const duration = req.body.duration;
    const soundCloudinaryId = Date.now() + 'sound_file';
    const videoCloudinaryId = Date.now() + 'video_file';
    const resultVideoCloudinaryId = Date.now() + 'result_video_file';
    const volume = req.body.volume || '-30';
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
            {effect: `volume:${volume}`}
          ];
          transformation.push({flags: 'layer_apply', duration, start_offset});
          const url = cloudinary.url(
                          videoCloudinaryId,
                          {resource_type: resourceTypeVideo, transformation}) +
              '.mp4';
          return saveDataToCloudStorage(
              url, gcsOutputVideoFolder);
        })
        .then(([finalVideoUrl]) => {
          console.log('url: ' + finalVideoUrl + '\n');
          res.status(200).send({message: 'success', url: finalVideoUrl});
        })
        .catch(error => {
          console.error(error);
          return res.status(500).send(
              {message: 'Failed to add sound to video. Error: ' + JSON.stringify(error)});
        });
  } else {
    next();
  }
});

// clang-format off
/* Sample call:
curl -X POST -H "Content-Type: application/json" \
--data '{"video_clip_urls":["https://res.cloudinary.com/dgxcndjdr/video/upload/v1711664702/concat_2_1711664701982.webm", "https://res.cloudinary.com/dgxcndjdr/video/upload/v1711662224/ohfcvzwoqcondzpdtupy.webm"], "top_text_overlays": ["t1111!!!", "t22222!!!"], "bottom_text_overlays": ["b1111!!!", "b22222!!!"]}' \
http://0.0.0.0:8080/video/add_text_and_convert_to_gif
*/
// clang-format on
router.use('/video/add_text_and_convert_to_gif', async (req, res, next) => {
  if (req.method === 'POST') {
    const videoUrls = req.body.video_clip_urls;
    const topTextOverlays = req.body.top_text_overlays;
    const bottomTextOverlays = req.body.bottom_text_overlays;
    let videoPublicIds = [];
    const uploadVideoPromises = videoUrls.map((videoUrl, index) => {
      const publicId = publicIdBase(`gif_${index}`);
      videoPublicIds.push(publicId);
      return uploadToCloudinary(videoUrl, publicId, resourceTypeVideo);
    });
    Promise.all(uploadVideoPromises)
        .then(() => {
          const gcsSaves = videoPublicIds.map((videoCloudinaryId, index) => {
            var transformation = [
              topTextOverlays[index].length > 0 && {
                color: "#FFFFFFFF",
                overlay: {font_family: "impact",
                font_size: 65, font_weight: "bold",
                letter_spacing: 6,
                text: topTextOverlays[index]},
                gravity: "north",
                y: 20, // top margin
              },
              bottomTextOverlays[index].length > 0 && {
                color: "#FFFFFFFF",
                overlay: {font_family: "impact",
                font_size: 65, font_weight: "bold",
                letter_spacing: 6,
                text: bottomTextOverlays[index]},
                gravity: "south",
                y: 20, // bottom margin
              },
              {effect: "loop"}
            ];
            const url = cloudinary.url(
                            videoCloudinaryId,
                            {resource_type: resourceTypeVideo, transformation}) +
                '.gif';
            return saveDataToCloudStorage(
                url, gcsOutputVideoFolder);
          })
          return Promise.all(gcsSaves)
        })
        .then((resultGifUrls) => {
          console.log('url: ' + resultGifUrls + '\n');
          res.status(200).send({message: 'success', resultGifs: resultGifUrls.flat()});
        })
        .catch(error => {
          console.error(error);
          return res.status(500).send(
              {message: 'Failed to add sound to video. Error: ' + JSON.stringify(error)});
        });
  } else {
    next();
  }
});

module.exports = router;

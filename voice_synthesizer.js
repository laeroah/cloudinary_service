const express = require('express');
const textToSpeech = require('@google-cloud/text-to-speech');
// const {GoogleAuth, grpc} = require('google-gax');
const fs = require('fs');
const fsPromise = require('fs').promises;
const util = require('util');
const {saveToCloudStorage} = require('./gcs');
const {uploadToCloudinary, resourceTypeAudio, resourceTypeSubtitle} =
    require('./cloudinary');
var xmlToJsonParser = require('xml2json');
var bodyParser = require('body-parser')
// const {sample_story_ssml, sample_time_points} = require('./constants');

const router = express.Router();
// Creates a client
const client = new textToSpeech.v1beta1.TextToSpeechClient();

const synthesizeVoice = (ssml_text, audioFileName) => {
  // Construct the request
  const request = {
    input: {ssml: ssml_text},
    // Select the language and SSML voice gender (optional)
    voice:
        {languageCode: 'en-GB', ssmlGender: 'MALE', name: 'en-US-Wavenet-I'},
    // select the type of audio encoding
    audioConfig: {audioEncoding: 'MP3'},
    // enable timepoint
    enableTimePointing: ['SSML_MARK']
  };

  var timepoints;
  return client.synthesizeSpeech(request)
      .then(([response]) => {
        timepoints = response.timepoints;
        return fsPromise.writeFile(
            `${__dirname}/${audioFileName}`, response.audioContent, 'binary');
      })
      .then(() => {
        return timepoints;
      })
};

String.prototype.toSRTTimeCode = function() {
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
};

const generateSRT = (srtFileName, ssmlStr, timePoints) => {
  ssml = JSON.parse(xmlToJsonParser.toJson(ssmlStr));
  const subtitleFile = fs.createWriteStream(srtFileName);
  let paragraphDurations = [];
  let previousParagraphStartingSeconds = 0;
  let paragraphCount = 0;
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
    const timeLine = `${startTime} --> ${endTime}` +
        '\n';
    subtitleFile.write(timeLine);
    console.log('writing to SRT: ' + timeLine);
    subtitleFile.write(text + '\n\n');
    console.log('writing to SRT: ' + text);
    if (mark.isHead) {
      paragraphCount++;
      if (paragraphCount > 1) {
        paragraphDurations.push(timeSeconds - previousParagraphStartingSeconds);
      }
      previousParagraphStartingSeconds = timeSeconds;
    }
    if (index == timePoints.length - 1) {
      paragraphDurations.push(
          nextTimeSeconds - previousParagraphStartingSeconds);
    }
  }
  subtitleFile.end();
  return new Promise((resolve, reject) => {
    subtitleFile.on('finish', () => {
      resolve(paragraphDurations);
    });
    subtitleFile.on('error', reject);
  });
};

const generateSSML = (paragraphs) => {
  let output = '<speak>';
  var startingCount = 1;
  for (let paragraph of paragraphs) {
    const result = tokenizeParagraph(paragraph, startingCount);
    output += result.output;
    startingCount += result.totalToken;
  }
  output += '</speak>';
  return output;
};

const tokenizeParagraph = (paragraph, startingCount) => {
  // Remove newlines from the paragraph
  paragraph = paragraph.replace(/(\r\n|\n|\r)/gm, ' ');
  const words = paragraph.split(' ');
  let tokenCount = startingCount;
  let output = '';

  for (let i = 0; i < words.length; i += 4) {
    // Insert token every 4 words
    if (i % 4 === 0 && (i + 4) < words.length) {
      let text = words.slice(i, i + 4).join(' ');
      output += i == 0 ?
          `<mark name="${tokenCount}" text="${text.trim()}" isHead="yes"/>` :
          `<mark name="${tokenCount}" text="${text.trim()}"/>`;
      output += text;
      tokenCount++;
    } else if (i + 4 >= words.length) {
      let text = words.slice(i).join(' ');
      output += `<mark name="${tokenCount}" text="${text.trim()}"/>`;
      output += text;
      tokenCount++;
      break;
    }
  }

  return {output: output.trim(), totalToken: tokenCount - startingCount};
};

// clang-format off
/* Sample call:
curl -X POST -H "Content-Type: application/json" --data \
'{"paragraphs":["story paragraph 1 text","story paragraph 2 text"], "upload_to_gcs":false}' \
http://0.0.0.0:8080/synthesize_voice
*/
// clang-format on

router.use('/synthesize_voice', bodyParser.json(), async (req, res, next) => {
  if (req.method === 'POST') {
    const audioFileName = Date.now() + '.mp3';  // Generate a unique filename
    const subtitleFileName = Date.now() + '_subtitle.srt';
    if (req.body.paragraphs) {
      const uploadToGCS = req.body.upload_to_gcs;
      const paragraphs = req.body.paragraphs;
      const ssml = generateSSML(paragraphs);
      console.log(ssml);
      synthesizeVoice(ssml, audioFileName)
          .then((timepoints) => {
            console.log('result timepoints: ' + JSON.stringify(timepoints));
            return generateSRT(subtitleFileName, ssml, timepoints);
          })
          .then((paragraphDurations) => {
            console.log('audioFileName: ' + audioFileName);
            const totalDuration = paragraphDurations.reduce((a, b) => a + b, 0);
            const uploads = [
              {fileName: audioFileName, resourceType: resourceTypeAudio},
              {fileName: subtitleFileName, resourceType: resourceTypeSubtitle}
            ].map(async ({fileName, resourceType}) => {
              if (uploadToGCS) {
                const url = await saveToCloudStorage(
                    fileName, 'audio_files/' + fileName);
                return {resourceType, url: url};
              } else {
                // Make public id same as the file path.
                return uploadToCloudinary(fileName, fileName, resourceType);
              }
            });
            Promise.all(uploads)
                .then((results) => {
                  const successMessage =
                      'Audio and SRT synthesized successfully!';
                  console.log(successMessage);
                  if (uploadToGCS) {
                    var audioUrl;
                    var subtitleUrl;
                    for (const result of results) {
                      if (result.resourceType == resourceTypeAudio) {
                        audioUrl = result.url;
                      } else if (result.resourceType == resourceTypeSubtitle) {
                        subtitleUrl = result.url;
                      }
                    }
                    res.status(201).send({
                      message: successMessage,
                      audioUrl,
                      subtitleUrl,
                      paragraphDurations,
                      totalDuration
                    });
                  } else {
                    res.status(201).send({
                      message: successMessage,
                      audioPublicId: audioFileName,
                      subtitlePublicId: subtitleFileName,
                      paragraphDurations,
                      totalDuration
                    });
                  }
                })
                .catch(error => {
                  console.error(error);
                  return res.status(400).send({
                    message:
                        'Failed to synthesized audio and SRT. Error: ' + error
                  });
                })
                .finally(() => {
                  // Clean up the local file
                  fs.unlinkSync(subtitleFileName);
                  fs.unlinkSync(audioFileName);
                });
          })
          .catch((error) => {
            console.error('Failed to synthesized audio and SRT:', error);
            res.status(500).send('Failed to synthesized audio and SRT.');
          });
    } else {
      return res.status(400).send({message: 'Missing story paragraphs.'});
    }
  } else {
    next();
  }
});

module.exports = router;

const express = require('express');
const textToSpeech = require('@google-cloud/text-to-speech');
// const {GoogleAuth, grpc} = require('google-gax');
const fs = require('fs');
const util = require('util');
// const {saveToCloudStorage} = require('./gcs');
const {uploadToCloudinary} = require('./cloudinary');
var xmlToJsonParser = require('xml2json');
// const {sample_story_ssml, sample_time_points} = require('./constants');

const router = express.Router();
// Creates a client
const client = new textToSpeech.v1beta1.TextToSpeechClient();

const synthesizeVoice = async (ssml_text, audioFileName) => {
  // Construct the request
  const request = {
    input: {ssml: ssml_text},
    // Select the language and SSML voice gender (optional)
    voice:
        {languageCode: 'en-GB', ssmlGender: 'FEMALE', name: 'en-GB-Neural2-A'},
    // select the type of audio encoding
    audioConfig: {audioEncoding: 'MP3'},
    // enable timepoint
    enableTimePointing: ['SSML_MARK']
  };

  // Performs the text-to-speech request
  const [response] = await client.synthesizeSpeech(request);
  // Write the binary audio content to a local file
  const writeFile = util.promisify(fs.writeFile);
  writeFile(audioFileName, response.audioContent, 'binary');
  return {audioFileName, timepoints: response.timepoints};
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
    subtitleFile.write(
        `${startTime} --> ${endTime}` +
        '\n');
    subtitleFile.write(text + '\n\n');
    if (mark.isHead || index == timePoints.length - 1) {
      paragraphCount++;
      if (paragraphCount > 1) {
        paragraphDurations.push(timeSeconds - previousParagraphStartingSeconds);
      }
      previousParagraphStartingSeconds = timeSeconds;
    }
  }
  subtitleFile.end();
  return paragraphDurations;
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

  for (let i = 0; i < words.length; i+=4) {
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

// Sample call: curl -X POST -H "Content-Type: application/json" --data
// '{"paragraphs": ["story paragraph 1 text": "story paragraph 2 text"]}'
// http://0.0.0.0:8080/synthesize_voice
router.use('/synthesize_voice', async (req, res, next) => {
  if (req.method === 'POST') {
    const languageCode = 'en';
    const [result] = await client.listVoices({languageCode});
    const voices = result.voices;
    voices.forEach((voice) => {
      console.log(
          `${voice.name} (${voice.ssmlGender}): ${voice.languageCodes}`);
    });

    const filename = Date.now() + '.mp3';  // Generate a unique filename
    const subtitleFileName = Date.now() + '_subtitle.srt';
    if (req.body.paragraphs) {
      const paragraphs = req.body.paragraphs;
      const ssml = generateSSML(paragraphs);
      console.log(ssml);
      synthesizeVoice(ssml, filename)
          .then(({audioFileName, timepoints}) => {
            console.log('audioFileName: ' + audioFileName);
            const paragraphDurations =
                generateSRT(subtitleFileName, ssml, timepoints);
            const uploads = [
              {fileName: audioFileName, resourceType: 'video'},
              {fileName: subtitleFileName, resourceType: 'raw'}
            ].map(({fileName, resourceType}) => {
              // Make public id same as the file path.
              return uploadToCloudinary(fileName, fileName, resourceType);
            });
            Promise.all(uploads)
                .then(() => {
                  console.log('Audio and SRT synthesized successfully!');
                  res.status(201).send({
                    message: 'Audio and SRT synthesized successfully!',
                    audioPublicId: audioFileName,
                    subtitlePublicId: subtitleFileName,
                    paragraphDurations
                  });
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
            console.log('result timepoints: ' + JSON.stringify(timepoints));
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

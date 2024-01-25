const sample_story_ssml = `
<speak><mark name="1" text="Did you know that"/>Did you know that<mark name="2" text="The Great Emu War"/>The Great Emu War<mark name="3" text="took place in Australia"/>took place in Australia<mark name="4" text="in 1932? In the"/>in 1932? In the<mark name="5" text="rugged plains of Western"/>rugged plains of Western<mark name="6" text="Australia, soldiers clad in"/>Australia, soldiers clad in<mark name="7" text="military uniforms gathered their"/>military uniforms gathered their<mark name="8" text="weapons. Standing before them"/>weapons. Standing before them<mark name="9" text="were thousands of emus,"/>were thousands of emus,<mark name="10" text="large flightless birds with"/>large flightless birds with<mark name="11" text="feathers as brown as"/>feathers as brown as<mark name="12" text="the earth itself. The"/>the earth itself. The<mark name="13" text="emus moved cautiously, their"/>emus moved cautiously, their<mark name="14" text="large feet creating imprints"/>large feet creating imprints<mark name="15" text="in the dusty ground"/>in the dusty ground<mark name="16" text="as they approached the"/>as they approached the<mark name="17" text="army's position. With a"/>army's position. With a<mark name="18" text="commanding order, the soldiers"/>commanding order, the soldiers<mark name="19" text="unleashed a barrage of"/>unleashed a barrage of<mark name="20" text="bullets, aiming to quell"/>bullets, aiming to quell<mark name="21" text="the emu invasion. But"/>the emu invasion. But<mark name="22" text="the emus, nimble and"/>the emus, nimble and<mark name="23" text="quick, scattered in all"/>quick, scattered in all<mark name="24" text="directions, evading the soldiers'"/>directions, evading the soldiers'<mark name="25" text="onslaught. Undeterred, the army"/>onslaught. Undeterred, the army<mark name="26" text="persisted, launching a relentless"/>persisted, launching a relentless<mark name="27" text="assault in an attempt"/>assault in an attempt<mark name="28" text="to turn the tide."/>to turn the tide.<mark name="29" text="However, despite their efforts,"/>However, despite their efforts,<mark name="30" text="the emus proved to"/>the emus proved to<mark name="31" text="be formidable adversaries, their"/>be formidable adversaries, their<mark name="32" text="numbers seemingly endless. Ultimately,"/>numbers seemingly endless. Ultimately,<mark name="33" text="a decision was made"/>a decision was made<mark name="34" text="to withdraw the troops,"/>to withdraw the troops,<mark name="35" text="and the emus claimed"/>and the emus claimed<mark name="36" text="victory in what became"/>victory in what became<mark name="37" text="known as the Great"/>known as the Great</speak>
`;

const animate_durations = [9.6, 8.3, 7.2, 6.1, 7.3, 4.6, 8.1, 8.1];
const gcsComfyUIOutputVideoFolder = 'comfyui/output/video';

const sample_time_points = [
  {timeSeconds: 0.08642254769802094, markName: '1'},
  {timeSeconds: 0.7549177408218384, markName: '2'},
  {timeSeconds: 1.73957359790802, markName: '3'},
  {timeSeconds: 2.9644505977630615, markName: '4'},
  {timeSeconds: 5.240354537963867, markName: '5'},
  {timeSeconds: 6.385107040405273, markName: '6'},
  {timeSeconds: 8.11279296875, markName: '7'},
  {timeSeconds: 9.618419647216797, markName: '8'},
  {timeSeconds: 12.212960243225098, markName: '9'},
  {timeSeconds: 13.652225494384766, markName: '10'},
  {timeSeconds: 14.988801956176758, markName: '11'},
  {timeSeconds: 16.010141372680664, markName: '12'},
  {timeSeconds: 17.984981536865234, markName: '13'},
  {timeSeconds: 19.73822021484375, markName: '14'},
  {timeSeconds: 21.388980865478516, markName: '15'},
  {timeSeconds: 22.34579086303711, markName: '16'},
  {timeSeconds: 23.15926742553711, markName: '17'},
  {timeSeconds: 25.11285972595215, markName: '18'},
  {timeSeconds: 26.808195114135742, markName: '19'},
  {timeSeconds: 27.848831176757812, markName: '20'},
  {timeSeconds: 29.13654327392578, markName: '21'},
  {timeSeconds: 31.233062744140625, markName: '22'},
  {timeSeconds: 32.645416259765625, markName: '23'},
  {timeSeconds: 33.91246795654297, markName: '24'},
  {timeSeconds: 35.75883483886719, markName: '25'},
  {timeSeconds: 38.566795349121094, markName: '26'},
  {timeSeconds: 40.40128707885742, markName: '27'},
  {timeSeconds: 41.41554260253906, markName: '28'},
  {timeSeconds: 43.13718795776367, markName: '29'},
  {timeSeconds: 45.17160415649414, markName: '30'},
  {timeSeconds: 46.14360809326172, markName: '31'},
  {timeSeconds: 47.78759765625, markName: '32'},
  {timeSeconds: 51.082698822021484, markName: '33'},
  {timeSeconds: 52.03341293334961, markName: '34'},
  {timeSeconds: 53.313079833984375, markName: '35'},
  {timeSeconds: 54.28957748413086, markName: '36'},
  {timeSeconds: 55.329681396484375, markName: '37'}
];

cloudinary_config = {
  cloud_name: 'dgxcndjdr',
  api_key: '697581946523117',
  api_secret: '09czU54XnUfCElaxhTNg7LOnEkQ'
};

module.exports = {
  sample_story_ssml,
  animate_durations,
  cloudinary_config,
  sample_time_points,
  gcsComfyUIOutputVideoFolder
};

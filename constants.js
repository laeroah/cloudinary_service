const sample_story_ssml =
`
<speak>
<mark name="1" text="Did you know"/>Did you know <mark name="2" text="that the very first"/>that the very first <mark name="3" text="Google Doodle"/>Google Doodle
<mark name="4" text="wasn't a planned"/>wasn't a planned <mark name="5" text="celebration, but"/>celebration, but <mark name="6" text="a mischievous cry"/>a mischievous cry
<mark name="7" text="for help? Back in"/>for help? Back in <mark name="8" text="1998, founders"/>1998, founders <mark name="9" text="Larry Page and"/>Larry Page and
<mark name="10" text="Sergey Brin were"/>Sergey Brin were <mark name="11" text="heading out to"/>heading out to <mark name="12" text="Burning Man, the"/>Burning Man, the
<mark name="13" text="wild and wacky"/>wild and wacky <mark name="14" text="festival in the"/>festival in the <mark name="15" text="Black Rock Desert."/>Black Rock Desert.
<mark name="16" text="They wanted to"/>They wanted to <mark name="17" text="let users know"/>let users know <mark name="18" text="they were out"/>they were out
<mark name="19" text="of office, but"/>of office, but <mark name="20" text="with a typical"/>with a typical <mark name="21" text="Google twist. So,"/>Google twist. So,
<mark name="22" text="they plopped a"/>they plopped a <mark name="23" text="stick figure"/>stick figure <mark name="24" text="drawing of a"/>drawing of a
<mark name="25" text="burning man"/>burning man <mark name="26" text="behind the Google"/>behind the Google <mark name="27" text="logo. It was"/>logo. It was
<mark name="28" text="meant to be a"/>meant to be a <mark name="29" text="quick and silly"/>quick and silly <mark name="30" text="thing, but it"/>thing, but it
<mark name="31" text="ended up sparking"/>ended up sparking <mark name="32" text="a tradition that"/>a tradition that <mark name="33" text="now sees Doodles"/>now sees Doodles
<mark name="34" text="grace the homepage"/>grace the homepage <mark name="35" text="for everything from"/>for everything from <mark name="36" text="major holidays"/>major holidays
<mark name="37" text="to obscure historical"/>to obscure historical <mark name="38" text="figures. Who knew"/>figures. Who knew <mark name="39" text="a little Burning"/>a little Burning
<mark name="40" text="Man burner could"/>Man burner could <mark name="41" text="ignite such a"/>ignite such a <mark name="42" text="creative firestorm?"/>creative firestorm?
<mark name="43" text="So next time you"/>So next time you <mark name="44" text="see a Doodle,"/>see a Doodle, <mark name="45" text="remember its humble"/>remember its humble
<mark name="46" text="beginnings: a playful"/>beginnings: a playful <mark name="47" text="wink from the"/>wink from the <mark name="48" text="Google founders,"/>Google founders,
<mark name="49" text="reminding us that"/>reminding us that <mark name="50" text="even the biggest tech giants"/>even the biggest tech giants even the biggest tech giants <mark name="51" text="can have a bit of fun."/>can have a bit of fun.
</speak>
`;

const sample_time_points =
[
  { timeSeconds: 0.08739781379699707, markName: '1' },
  { timeSeconds: 0.6049315333366394, markName: '2' },
  { timeSeconds: 1.482468843460083, markName: '3' },
  { timeSeconds: 2.140768051147461, markName: '4' },
  { timeSeconds: 2.799055337905884, markName: '5' },
  { timeSeconds: 3.8285257816314697, markName: '6' },
  { timeSeconds: 4.686862945556641, markName: '7' },
  { timeSeconds: 6.372307300567627, markName: '8' },
  { timeSeconds: 8.068525314331055, markName: '9' },
  { timeSeconds: 8.879302978515625, markName: '10' },
  { timeSeconds: 9.68212890625, markName: '11' },
  { timeSeconds: 10.261804580688477, markName: '12' },
  { timeSeconds: 11.179749488830566, markName: '13' },
  { timeSeconds: 12.027859687805176, markName: '14' },
  { timeSeconds: 12.755973815917969, markName: '15' },
  { timeSeconds: 14.510027885437012, markName: '16' },
  { timeSeconds: 15.112460136413574, markName: '17' },
  { timeSeconds: 15.89113998413086, markName: '18' },
  { timeSeconds: 16.373340606689453, markName: '19' },
  { timeSeconds: 17.247873306274414, markName: '20' },
  { timeSeconds: 17.88194465637207, markName: '21' },
  { timeSeconds: 20.341156005859375, markName: '22' },
  { timeSeconds: 20.90367889404297, markName: '23' },
  { timeSeconds: 21.536895751953125, markName: '24' },
  { timeSeconds: 22.040050506591797, markName: '25' },
  { timeSeconds: 22.68703842163086, markName: '26' },
  { timeSeconds: 23.446189880371094, markName: '27' },
  { timeSeconds: 25.037189483642578, markName: '28' },
  { timeSeconds: 25.604324340820312, markName: '29' },
  { timeSeconds: 26.309467315673828, markName: '30' },
  { timeSeconds: 27.190603256225586, markName: '31' },
  { timeSeconds: 28.079612731933594, markName: '32' },
  { timeSeconds: 28.744924545288086, markName: '33' },
  { timeSeconds: 29.727890014648438, markName: '34' },
  { timeSeconds: 30.665006637573242, markName: '35' },
  { timeSeconds: 31.433292388916016, markName: '36' },
  { timeSeconds: 32.29425811767578, markName: '37' },
  { timeSeconds: 33.42818832397461, markName: '38' },
  { timeSeconds: 35.255985260009766, markName: '39' },
  { timeSeconds: 36.00446701049805, markName: '40' },
  { timeSeconds: 36.753501892089844, markName: '41' },
  { timeSeconds: 37.48116683959961, markName: '42' },
  { timeSeconds: 39.53437805175781, markName: '43' },
  { timeSeconds: 40.48606491088867, markName: '44' },
  { timeSeconds: 41.479732513427734, markName: '45' },
  { timeSeconds: 42.35875701904297, markName: '46' },
  { timeSeconds: 43.7050666809082, markName: '47' },
  { timeSeconds: 44.26942443847656, markName: '48' },
  { timeSeconds: 45.28046798706055, markName: '49' },
  { timeSeconds: 46.038490295410156, markName: '50' },
  { timeSeconds: 48.648101806640625, markName: '51' }
];

module.exports = {
  sample_story_ssml,
  sample_time_points
};

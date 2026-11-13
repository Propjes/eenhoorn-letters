# 🦄 Eenhoorn Letters

Een vrolijk 3D-browserspel voor kinderen uit groep 3 (6-7 jaar) die letters leren.

Bestuur je dier (eenhoorn, paard of otter) door een kleurrijke 3D-wei en verzamel de zwevende letterblokjes
van het woord bovenaan. Loop tegen een blokje aan om de letter te sparen: het spat
uit elkaar in vonkjes met een vrolijk geluidje. Is het woord compleet? Confetti,
fanfare en een ster! ⭐

## Bestanden

- `index.html` — de pagina (laadt Three.js r128 via CDN)
- `style.css` — de styling (pastel, groot rond lettertype)
- `game.js` — de 3D-wereld en spellogica (Three.js + WebAudio)
- `README.md` — dit bestand

## Spelen

Open `index.html` in een browser. Geen build-stap nodig.

- Kies aan het begin je dier: eenhoorn 🦄, paard 🐴 of otter 🦦
- Bewegen: pijltjestoetsen of WASD, relatief ten opzichte van de camera (op tablet: de ronde knoppen onderaan)
- 🔊 geluid aan/uit, 🔄 opnieuw beginnen

## Woordenlijst

kat 🐱, hond 🐶, zon ☀️, maan 🌙, vis 🐟, boom 🌳, huis 🏠, kip 🐔, eend 🦆,
bal ⚽, tas 🎒, pen ✏️, boek 📖, deur 🚪, mus 🐭, raam 🪟

## Techniek

- Three.js r128 via CDN, WebGL, 3D-model van primitieven (geen externe bestanden)
- Geluidjes via WebAudio (gesynthetiseerd, start na de eerste klik)
- Alleen kleine letters (a-z); verkeerde letters spaar je gewoon ook

(function () {
  "use strict";

  var WOORDEN = [
    { woord: "kat", emoji: "🐱" },
    { woord: "hond", emoji: "🐶" },
    { woord: "zon", emoji: "☀️" },
    { woord: "maan", emoji: "🌙" },
    { woord: "vis", emoji: "🐟" },
    { woord: "boom", emoji: "🌳" },
    { woord: "huis", emoji: "🏠" },
    { woord: "kip", emoji: "🐔" },
    { woord: "eend", emoji: "🦆" },
    { woord: "bal", emoji: "⚽" },
    { woord: "tas", emoji: "🎒" },
    { woord: "pen", emoji: "✏️" },
    { woord: "boek", emoji: "📖" },
    { woord: "deur", emoji: "🚪" },
    { woord: "mus", emoji: "🐭" },
    { woord: "raam", emoji: "🪟" }
  ];

  var ALFABET = "abcdefghijklmnopqrstuvwxyz";

  var startscherm = document.getElementById("startscherm");
  var startKnop = document.getElementById("start-knop");
  var hud = document.getElementById("hud");
  var woordEmojiEl = document.getElementById("woord-emoji");
  var woordLettersEl = document.getElementById("woord-letters");
  var sterrenEl = document.getElementById("sterren");
  var geluidKnop = document.getElementById("geluid-knop");
  var opnieuwKnop = document.getElementById("opnieuw-knop");
  var spaarbakEl = document.getElementById("spaarbak");
  var bannerEl = document.getElementById("banner");

  var audioCtx = null;
  var masterGain = null;
  var muted = false;
  var muziekTimer = null;
  var muziekIndex = 0;

  var MUZIEK = [523.25, 659.25, 783.99, 659.25, 880.0, 783.99, 659.25, 587.33,
    523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 587.33, 523.25];

  function initAudio() {
    var AC = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AC();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.9;
    masterGain.connect(audioCtx.destination);
  }

  function speelNoot(freq, start, duur, type, volume) {
    if (!audioCtx) return;
    var t = audioCtx.currentTime + start;
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duur);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t);
    osc.stop(t + duur + 0.05);
  }

  function popGeluid() {
    if (!audioCtx) return;
    var t = audioCtx.currentTime;
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(980, t + 0.12);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  function startMuziek() {
    muziekTimer = setInterval(function () {
      if (!muted && audioCtx && audioCtx.state === "running") {
        speelNoot(MUZIEK[muziekIndex % MUZIEK.length], 0, 0.9, "sine", 0.06);
      }
      muziekIndex++;
    }, 450);
  }

  var renderer, scene, camera;
  var unicorn, unicornBody, poten = [];
  var heading = 0;
  var loopFase = 0;
  var wolken = [];
  var vlinders = [];
  var konijn;
  var konijnDoel = new THREE.Vector3();
  var konijnTeller = 0;

  var gameStarted = false;
  var vieringActief = false;
  var sterren = 0;
  var huidigWoord = null;
  var laatsteWoord = null;
  var doelLetters = [];
  var gevuld = [];
  var letterBlokken = [];
  var vonkjes = [];
  var confetti = [];

  function letterKleur(letter) {
    var h = ((letter.charCodeAt(0) - 97) * 137) % 360;
    return new THREE.Color("hsl(" + h + ", 85%, 55%)");
  }

  function letterHex(letter) {
    return "#" + letterKleur(letter).getHexString();
  }

  function initScene() {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    document.getElementById("canvas-houder").appendChild(renderer.domElement);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 45, 130);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 300);
    camera.position.set(0, 5, -9);

    var hemi = new THREE.HemisphereLight(0xbfe3ff, 0x5da844, 0.9);
    scene.add(hemi);

    var zon = new THREE.DirectionalLight(0xfff3c4, 1.1);
    zon.position.set(30, 50, 20);
    zon.castShadow = true;
    zon.shadow.mapSize.width = 2048;
    zon.shadow.mapSize.height = 2048;
    zon.shadow.camera.left = -40;
    zon.shadow.camera.right = 40;
    zon.shadow.camera.top = 40;
    zon.shadow.camera.bottom = -40;
    zon.shadow.camera.far = 120;
    scene.add(zon);

    maakGrond();
    maakZon();
    maakHeuvels();
    maakWolken();
    maakBomen();
    maakBloemen();
    unicorn = maakEenhoorn();
    unicornBody = unicorn.body;
    scene.add(unicorn.group);
    maakVlinders();
    konijn = maakKonijn();
    scene.add(konijn.group);
    kiesKonijnDoel();
  }

  function maakGrasTextuur() {
    var c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    var ctx = c.getContext("2d");
    ctx.fillStyle = "#6ec24a";
    ctx.fillRect(0, 0, 256, 256);
    for (var i = 0; i < 1400; i++) {
      ctx.fillStyle = Math.random() < 0.5 ? "#63b340" : "#7ed057";
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 3, 3);
    }
    var tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(24, 24);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  function maakGrond() {
    var grond = new THREE.Mesh(
      new THREE.PlaneGeometry(260, 260),
      new THREE.MeshLambertMaterial({ map: maakGrasTextuur() })
    );
    grond.rotation.x = -Math.PI / 2;
    grond.receiveShadow = true;
    scene.add(grond);
  }

  function maakZon() {
    var zon = new THREE.Mesh(
      new THREE.SphereGeometry(6, 24, 18),
      new THREE.MeshBasicMaterial({ color: 0xffdd44, fog: false })
    );
    zon.position.set(70, 60, -95);
    scene.add(zon);
  }

  function maakHeuvels() {
    var kleur = new THREE.MeshLambertMaterial({ color: 0x4da85e });
    for (var i = 0; i < 6; i++) {
      var r = 18 + Math.random() * 16;
      var heuvel = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), kleur);
      var a = (i / 6) * Math.PI * 2 + Math.random() * 0.5;
      var d = 78 + Math.random() * 25;
      heuvel.position.set(Math.cos(a) * d, r * 0.32, Math.sin(a) * d);
      heuvel.scale.y = 0.55;
      scene.add(heuvel);
    }
  }

  function maakWolken() {
    var wit = new THREE.MeshLambertMaterial({ color: 0xffffff });
    for (var i = 0; i < 6; i++) {
      var wolk = new THREE.Group();
      var n = 3 + Math.floor(Math.random() * 3);
      for (var j = 0; j < n; j++) {
        var bol = new THREE.Mesh(new THREE.SphereGeometry(2 + Math.random() * 2, 14, 10), wit);
        bol.position.set(j * 2.6 - n, Math.random() * 1.2, Math.random() * 1.5);
        bol.scale.y = 0.6;
        wolk.add(bol);
      }
      wolk.position.set((Math.random() - 0.5) * 200, 26 + Math.random() * 12, -60 + Math.random() * 70);
      wolk.userData = { snelheid: 0.6 + Math.random() * 1.2 };
      scene.add(wolk);
      wolken.push(wolk);
    }
  }

  function maakBomen() {
    var stamMat = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
    var bladMat = new THREE.MeshLambertMaterial({ color: 0x2f9e44 });
    var bladMat2 = new THREE.MeshLambertMaterial({ color: 0x40c057 });
    for (var i = 0; i < 9; i++) {
      var boom = new THREE.Group();
      var stam = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.42, 2, 10), stamMat);
      stam.position.y = 1;
      stam.castShadow = true;
      boom.add(stam);
      var mat = i % 2 === 0 ? bladMat : bladMat2;
      var k1 = new THREE.Mesh(new THREE.SphereGeometry(1.6, 14, 10), mat);
      k1.position.y = 2.8;
      k1.castShadow = true;
      boom.add(k1);
      var k2 = new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 9), mat);
      k2.position.set(0.8, 3.6, 0.3);
      k2.castShadow = true;
      boom.add(k2);
      var a = Math.random() * Math.PI * 2;
      var r = 12 + Math.random() * 16;
      boom.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      boom.rotation.y = Math.random() * Math.PI * 2;
      scene.add(boom);
    }
  }

  function maakBloemen() {
    var kleuren = [0xff6b9d, 0xffd43b, 0xff922b, 0xe599f7, 0xffffff, 0x74c0fc, 0xff8787];
    var stamMat = new THREE.MeshLambertMaterial({ color: 0x2f9e44 });
    for (var i = 0; i < 50; i++) {
      var bloem = new THREE.Group();
      var stam = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), stamMat);
      stam.position.y = 0.25;
      bloem.add(stam);
      var kop = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 10, 8),
        new THREE.MeshLambertMaterial({ color: kleuren[i % kleuren.length] })
      );
      kop.position.y = 0.55;
      bloem.add(kop);
      var a = Math.random() * Math.PI * 2;
      var r = 3 + Math.random() * 25;
      bloem.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      scene.add(bloem);
    }
  }

  function maakEenhoorn() {
    var group = new THREE.Group();
    var body = new THREE.Group();
    group.add(body);

    var wit = new THREE.MeshLambertMaterial({ color: 0xffffff });
    var goud = new THREE.MeshLambertMaterial({ color: 0xffd700 });
    var roze = new THREE.MeshLambertMaterial({ color: 0xff7ad9 });
    var paars = new THREE.MeshLambertMaterial({ color: 0xa06bff });
    var turquoise = new THREE.MeshLambertMaterial({ color: 0x40e0d0 });
    var oogMat = new THREE.MeshLambertMaterial({ color: 0x222222 });

    var romp = new THREE.Mesh(new THREE.SphereGeometry(0.9, 24, 18), wit);
    romp.scale.set(1, 0.9, 1.35);
    romp.position.y = 1.15;
    romp.castShadow = true;
    body.add(romp);

    var hoofd = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 18), wit);
    hoofd.position.set(0, 1.95, 0.95);
    hoofd.castShadow = true;
    body.add(hoofd);

    var snuit = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 14), wit);
    snuit.scale.set(0.9, 0.7, 1.2);
    snuit.position.set(0, 1.8, 1.45);
    body.add(snuit);

    var hoorn = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.75, 16), goud);
    hoorn.position.set(0, 2.55, 0.95);
    hoorn.rotation.x = -0.15;
    hoorn.castShadow = true;
    body.add(hoorn);

    [-1, 1].forEach(function (zijde) {
      var oor = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.4, 10), wit);
      oor.position.set(zijde * 0.28, 2.42, 0.78);
      oor.rotation.z = -zijde * 0.35;
      body.add(oor);
      var oog = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), oogMat);
      oog.position.set(zijde * 0.24, 2.05, 1.36);
      body.add(oog);
    });

    var manen = [
      { pos: [0, 2.35, 0.55], r: 0.3, mat: roze },
      { pos: [0, 2.2, 0.25], r: 0.27, mat: paars },
      { pos: [0, 2.0, -0.05], r: 0.25, mat: turquoise },
      { pos: [0, 2.42, 1.2], r: 0.2, mat: roze }
    ];
    manen.forEach(function (m) {
      var bol = new THREE.Mesh(new THREE.SphereGeometry(m.r, 14, 10), m.mat);
      bol.position.set(m.pos[0], m.pos[1], m.pos[2]);
      body.add(bol);
    });

    var staart = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.8, 12), turquoise);
    staart.position.set(0, 1.25, -1.2);
    staart.rotation.x = Math.PI * 0.65;
    body.add(staart);

    [[-0.42, 0.62], [0.42, 0.62], [-0.42, -0.62], [0.42, -0.62]].forEach(function (p) {
      var poot = new THREE.Group();
      poot.position.set(p[0], 0.85, p[1]);
      var been = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.85, 0.22), wit);
      been.position.y = -0.42;
      been.castShadow = true;
      poot.add(been);
      var hoef = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.24), paars);
      hoef.position.y = -0.8;
      poot.add(hoef);
      body.add(poot);
      poten.push(poot);
    });

    return { group: group, body: body };
  }

  function maakVlinders() {
    var kleuren = [0xff6b9d, 0xffd43b, 0xa06bff, 0x74c0fc, 0x40e0d0];
    for (var i = 0; i < 5; i++) {
      var g = new THREE.Group();
      var lijf = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.4, 8),
        new THREE.MeshLambertMaterial({ color: 0x333333 })
      );
      lijf.rotation.x = Math.PI / 2;
      g.add(lijf);
      var kleur = kleuren[i % kleuren.length];
      [-1, 1].forEach(function (zijde) {
        var vleugelGeo = new THREE.PlaneGeometry(0.55, 0.4);
        vleugelGeo.translate(zijde * 0.27, 0, 0);
        var vleugel = new THREE.Mesh(
          vleugelGeo,
          new THREE.MeshBasicMaterial({ color: kleur, side: THREE.DoubleSide })
        );
        vleugel.rotation.x = -Math.PI / 2;
        g.add(vleugel);
        if (zijde === 1) {
          g.userData.rechterVleugel = vleugel;
        } else {
          g.userData.linkerVleugel = vleugel;
        }
      });
      g.userData.data = {
        cx: (Math.random() - 0.5) * 30,
        cz: (Math.random() - 0.5) * 30,
        radius: 3 + Math.random() * 5,
        hoek: Math.random() * Math.PI * 2,
        snelheid: 0.6 + Math.random() * 0.7,
        hoogte: 1.5 + Math.random() * 2.5,
        fase: Math.random() * Math.PI * 2
      };
      scene.add(g);
      vlinders.push(g);
    }
  }

  function maakKonijn() {
    var group = new THREE.Group();
    var wit = new THREE.MeshLambertMaterial({ color: 0xffffff });
    var roze = new THREE.MeshLambertMaterial({ color: 0xffb3d1 });
    var romp = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 12), wit);
    romp.scale.set(1, 0.9, 1.2);
    romp.position.y = 0.4;
    romp.castShadow = true;
    group.add(romp);
    var hoofd = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), wit);
    hoofd.position.set(0, 0.68, 0.35);
    group.add(hoofd);
    [-1, 1].forEach(function (z) {
      var oor = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.4, 8), wit);
      oor.position.set(z * 0.1, 0.98, 0.3);
      oor.rotation.z = -z * 0.15;
      group.add(oor);
      var oorBinnen = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.28, 8), roze);
      oorBinnen.position.set(z * 0.1, 0.96, 0.34);
      oorBinnen.rotation.z = -z * 0.15;
      group.add(oorBinnen);
    });
    var staart = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), wit);
    staart.position.set(0, 0.42, -0.4);
    group.add(staart);
    group.position.set(5, 0, 5);
    return { group: group };
  }

  function kiesKonijnDoel() {
    var a = Math.random() * Math.PI * 2;
    var r = 4 + Math.random() * 16;
    konijnDoel.set(Math.cos(a) * r, 0, Math.sin(a) * r);
  }

  function maakLetterTextuur(letter, kleur) {
    var c = document.createElement("canvas");
    c.width = 128;
    c.height = 128;
    var ctx = c.getContext("2d");
    ctx.fillStyle = "#" + kleur.getHexString();
    ctx.fillRect(0, 0, 128, 128);
    ctx.font = "bold 88px 'Comic Sans MS', 'Chalkboard SE', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 10;
    ctx.strokeStyle = "rgba(60, 20, 90, 0.85)";
    ctx.strokeText(letter, 64, 70);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(letter, 64, 70);
    var tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  function maakLetterBlok(letter) {
    var kleur = letterKleur(letter);
    var zij = new THREE.MeshLambertMaterial({ color: kleur.clone().multiplyScalar(0.72) });
    var voorkant = new THREE.MeshLambertMaterial({ map: maakLetterTextuur(letter, kleur) });
    var blok = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 1.1, 1.1),
      [zij, zij, zij, zij, voorkant, zij]
    );
    blok.castShadow = true;
    return blok;
  }

  function maakLetterBlokjes() {
    var letters = doelLetters.slice();
    var afleiding = [];
    var aantalAfleiding = 2 + Math.floor(Math.random() * 2);
    while (afleiding.length < aantalAfleiding) {
      var l = ALFABET[Math.floor(Math.random() * ALFABET.length)];
      if (doelLetters.indexOf(l) === -1 && afleiding.indexOf(l) === -1) {
        afleiding.push(l);
      }
    }
    letters = letters.concat(afleiding);
    for (var i = letters.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = letters[i];
      letters[i] = letters[j];
      letters[j] = tmp;
    }
    var bezet = [];
    letters.forEach(function (letter) {
      var x, z, pogingen = 0;
      do {
        var a = Math.random() * Math.PI * 2;
        var r = 7 + Math.random() * 17;
        x = Math.cos(a) * r;
        z = Math.sin(a) * r;
        pogingen++;
      } while (pogingen < 25 && bezet.some(function (p) {
        return Math.hypot(p.x - x, p.z - z) < 3.5;
      }));
      bezet.push({ x: x, z: z });
      var blok = maakLetterBlok(letter);
      blok.position.set(x, 1.3, z);
      blok.userData = {
        letter: letter,
        baseY: 1.3,
        fase: Math.random() * Math.PI * 2,
        draaiSnelheid: 1 + Math.random() * 0.8
      };
      scene.add(blok);
      letterBlokken.push(blok);
    });
  }

  function kiesWoord() {
    var w;
    do {
      w = WOORDEN[Math.floor(Math.random() * WOORDEN.length)];
    } while (w === laatsteWoord);
    laatsteWoord = w;
    return w;
  }

  function nieuwWoord() {
    huidigWoord = kiesWoord();
    doelLetters = huidigWoord.woord.split("");
    gevuld = doelLetters.map(function () { return false; });
    renderWoord();
    letterBlokken.forEach(function (b) { scene.remove(b); });
    letterBlokken = [];
    maakLetterBlokjes();
  }

  function renderWoord() {
    woordEmojiEl.textContent = huidigWoord.emoji;
    woordLettersEl.innerHTML = "";
    doelLetters.forEach(function (l, i) {
      var span = document.createElement("span");
      span.className = "letter-vak" + (gevuld[i] ? " gevuld" : "");
      span.textContent = gevuld[i] ? l : "_";
      if (gevuld[i]) span.style.color = letterHex(l);
      woordLettersEl.appendChild(span);
    });
  }

  function voegToeAanBak(letter) {
    var dot = document.createElement("span");
    dot.className = "spaar-letter";
    dot.textContent = letter;
    dot.style.background = letterHex(letter);
    spaarbakEl.appendChild(dot);
  }

  function verwerkLetter(letter) {
    voegToeAanBak(letter);
    var idx = -1;
    for (var i = 0; i < doelLetters.length; i++) {
      if (doelLetters[i] === letter && !gevuld[i]) {
        idx = i;
        break;
      }
    }
    if (idx === -1) return;
    gevuld[idx] = true;
    renderWoord();
    if (gevuld.every(function (g) { return g; })) {
      viering();
    }
  }

  function viering() {
    vieringActief = true;
    sterren++;
    sterrenEl.textContent = "⭐ " + sterren;
    bannerEl.classList.remove("verborgen");
    fanfareSpelen();
    maakConfetti();
    setTimeout(function () {
      bannerEl.classList.add("verborgen");
      vieringActief = false;
      nieuwWoord();
    }, 2500);
  }

  function fanfareSpelen() {
    var noten = [523.25, 659.25, 783.99, 1046.5];
    for (var i = 0; i < noten.length; i++) {
      speelNoot(noten[i], i * 0.14, 0.3, "triangle", 0.3);
    }
    var slot = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    for (var k = 0; k < slot.length; k++) {
      speelNoot(slot[k], 0.6, 1.1, "triangle", 0.2);
    }
  }

  function maakVonkjes(pos, kleur) {
    for (var i = 0; i < 14; i++) {
      var m = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 8, 6),
        new THREE.MeshBasicMaterial({ color: kleur })
      );
      m.position.copy(pos);
      scene.add(m);
      vonkjes.push({
        mesh: m,
        vel: new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 5 + 2, (Math.random() - 0.5) * 6),
        life: 0.7 + Math.random() * 0.3
      });
    }
  }

  function maakConfetti() {
    for (var i = 0; i < 90; i++) {
      var kleur = new THREE.Color("hsl(" + Math.floor(Math.random() * 360) + ", 90%, 60%)");
      var m = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.06, 0.18),
        new THREE.MeshBasicMaterial({ color: kleur })
      );
      m.position.set(
        unicorn.group.position.x + (Math.random() - 0.5) * 16,
        8 + Math.random() * 7,
        unicorn.group.position.z + (Math.random() - 0.5) * 16
      );
      scene.add(m);
      confetti.push({
        mesh: m,
        vy: 1.5 + Math.random() * 2,
        rot: new THREE.Vector3(Math.random() * 3, Math.random() * 3, Math.random() * 3),
        sway: Math.random() * Math.PI * 2,
        life: 3.5 + Math.random() * 1.5
      });
    }
  }

  function controleerLetters() {
    for (var i = letterBlokken.length - 1; i >= 0; i--) {
      var b = letterBlokken[i];
      var d = Math.hypot(
        b.position.x - unicorn.group.position.x,
        b.position.z - unicorn.group.position.z
      );
      if (d < 1.3) {
        var letter = b.userData.letter;
        scene.remove(b);
        letterBlokken.splice(i, 1);
        maakVonkjes(b.position, letterKleur(letter));
        popGeluid();
        verwerkLetter(letter);
      }
    }
  }

  var toetsen = { links: false, rechts: false, omhoog: false, omlaag: false };
  var TOETS_MAP = {
    ArrowLeft: "links", a: "links",
    ArrowRight: "rechts", d: "rechts",
    ArrowUp: "omhoog", w: "omhoog",
    ArrowDown: "omlaag", s: "omlaag"
  };

  window.addEventListener("keydown", function (e) {
    var key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    var richting = TOETS_MAP[key];
    if (richting) {
      toetsen[richting] = true;
      e.preventDefault();
    }
  });

  window.addEventListener("keyup", function (e) {
    var key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    var richting = TOETS_MAP[key];
    if (richting) toetsen[richting] = false;
  });

  Array.prototype.forEach.call(document.querySelectorAll(".aanraak"), function (knop) {
    var richting = knop.getAttribute("data-richting");
    function aan(e) { e.preventDefault(); toetsen[richting] = true; knop.classList.add("actief"); }
    function uit(e) { e.preventDefault(); toetsen[richting] = false; knop.classList.remove("actief"); }
    knop.addEventListener("pointerdown", aan);
    knop.addEventListener("pointerup", uit);
    knop.addEventListener("pointerleave", uit);
    knop.addEventListener("pointercancel", uit);
  });

  function updateBeweging(dt) {
    var dx = (toetsen.rechts ? 1 : 0) - (toetsen.links ? 1 : 0);
    var dz = (toetsen.omlaag ? 1 : 0) - (toetsen.omhoog ? 1 : 0);
    var bewegend = dx !== 0 || dz !== 0;
    if (bewegend && !vieringActief) {
      var doelHoek = Math.atan2(dx, dz);
      var diff = doelHoek - heading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      heading += diff * Math.min(1, dt * 10);
      var snelheid = 7;
      unicorn.group.position.x += Math.sin(heading) * snelheid * dt;
      unicorn.group.position.z += Math.cos(heading) * snelheid * dt;
      var r = Math.hypot(unicorn.group.position.x, unicorn.group.position.z);
      if (r > 26) {
        unicorn.group.position.x *= 26 / r;
        unicorn.group.position.z *= 26 / r;
      }
      loopFase += dt * 10;
    }
    unicorn.group.rotation.y = heading;
    var bob = bewegend && !vieringActief ? Math.abs(Math.sin(loopFase)) * 0.12 : 0;
    unicornBody.position.y = bob;
    var zwaai = bewegend && !vieringActief ? Math.sin(loopFase) * 0.55 : 0;
    poten.forEach(function (p, i) {
      p.rotation.x = i % 2 === 0 ? zwaai : -zwaai;
    });

    var camDoel = new THREE.Vector3(
      unicorn.group.position.x - Math.sin(heading) * 8,
      5,
      unicorn.group.position.z - Math.cos(heading) * 8
    );
    camera.position.lerp(camDoel, Math.min(1, dt * 4));
    camera.lookAt(unicorn.group.position.x, 2, unicorn.group.position.z);
  }

  function updateWereld(dt, t) {
    wolken.forEach(function (wolk) {
      wolk.position.x += wolk.userData.snelheid * dt;
      if (wolk.position.x > 120) wolk.position.x = -120;
    });

    vlinders.forEach(function (v) {
      var d = v.userData.data;
      d.hoek += d.snelheid * dt;
      v.position.set(
        d.cx + Math.cos(d.hoek) * d.radius,
        d.hoogte + Math.sin(t * 2 + d.fase) * 0.4,
        d.cz + Math.sin(d.hoek) * d.radius
      );
      v.rotation.y = -d.hoek;
      var flap = Math.sin(t * 18 + d.fase) * 0.8;
      v.userData.rechterVleugel.rotation.z = flap;
      v.userData.linkerVleugel.rotation.z = -flap;
    });

    konijnTeller += dt;
    var direction = new THREE.Vector3().subVectors(konijnDoel, konijn.group.position);
    direction.y = 0;
    var afstand = direction.length();
    if (afstand < 0.5 || konijnTeller > 6) {
      kiesKonijnDoel();
      konijnTeller = 0;
    } else {
      direction.normalize();
      konijn.group.position.addScaledVector(direction, 2.2 * dt);
      konijn.group.rotation.y = Math.atan2(direction.x, direction.z);
      konijn.group.position.y = Math.abs(Math.sin(konijnTeller * 6)) * 0.45;
    }

    letterBlokken.forEach(function (b) {
      b.rotation.y += b.userData.draaiSnelheid * dt;
      b.position.y = b.userData.baseY + Math.sin(t * 2 + b.userData.fase) * 0.3;
    });

    for (var i = vonkjes.length - 1; i >= 0; i--) {
      var v = vonkjes[i];
      v.life -= dt;
      v.vel.y -= 9 * dt;
      v.mesh.position.addScaledVector(v.vel, dt);
      v.mesh.scale.setScalar(Math.max(0.1, v.life));
      if (v.life <= 0) {
        scene.remove(v.mesh);
        vonkjes.splice(i, 1);
      }
    }

    for (var c = confetti.length - 1; c >= 0; c--) {
      var cf = confetti[c];
      cf.life -= dt;
      cf.mesh.position.y -= cf.vy * dt;
      cf.mesh.position.x += Math.sin(t * 3 + cf.sway) * dt * 2;
      cf.mesh.rotation.x += cf.rot.x * dt;
      cf.mesh.rotation.y += cf.rot.y * dt;
      cf.mesh.rotation.z += cf.rot.z * dt;
      if (cf.life <= 0 || cf.mesh.position.y < 0) {
        scene.remove(cf.mesh);
        confetti.splice(c, 1);
      }
    }
  }

  var klok = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    var dt = Math.min(klok.getDelta(), 0.05);
    var t = klok.elapsedTime;
    updateBeweging(dt);
    if (gameStarted && !vieringActief) {
      controleerLetters();
    }
    updateWereld(dt, t);
    renderer.render(scene, camera);
  }

  window.addEventListener("resize", function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  geluidKnop.addEventListener("click", function () {
    muted = !muted;
    if (masterGain) masterGain.gain.value = muted ? 0 : 0.9;
    geluidKnop.textContent = muted ? "🔇" : "🔊";
  });

  opnieuwKnop.addEventListener("click", function () {
    sterren = 0;
    sterrenEl.textContent = "⭐ 0";
    spaarbakEl.innerHTML = "";
    bannerEl.classList.add("verborgen");
    vieringActief = false;
    unicorn.group.position.set(0, 0, 0);
    heading = 0;
    if (gameStarted) nieuwWoord();
  });

  startKnop.addEventListener("click", function () {
    initAudio();
    if (audioCtx.state === "suspended") audioCtx.resume();
    startMuziek();
    startscherm.classList.add("verborgen");
    hud.classList.remove("verborgen");
    gameStarted = true;
    nieuwWoord();
  });

  initScene();
  animate();
})();

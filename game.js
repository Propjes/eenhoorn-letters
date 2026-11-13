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
    { woord: "raam", emoji: "🪟" },
    { woord: "ijs", emoji: "🍦" },
    { woord: "kaas", emoji: "🧀" },
    { woord: "peer", emoji: "🍐" },
    { woord: "boos", emoji: "😠" },
    { woord: "koe", emoji: "🐄" },
    { woord: "poes", emoji: "🐈" },
    { woord: "tien", emoji: "🔟" },
    { woord: "ziek", emoji: "🤒" },
    { woord: "neus", emoji: "👃" },
    { woord: "hart", emoji: "❤️" }
  ];

  var ALFABET = "abcdefghijklmnopqrstuvwxyz";

  var TWEEKLANKEN = ["aa", "ee", "oo", "ui", "au", "ou", "eu", "oe", "ij", "ie", "ei"];

  function letterGroepen(woord) {
    var groepen = [];
    var i = 0;
    while (i < woord.length) {
      var twee = woord.substr(i, 2);
      if (TWEEKLANKEN.indexOf(twee) !== -1) {
        groepen.push(twee);
        i += 2;
      } else {
        groepen.push(woord.charAt(i));
        i += 1;
      }
    }
    return groepen;
  }

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
  var camHeading = 0;
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
    unicorn = maakDier(huidigDier);
    unicornBody = unicorn.body;
    poten = unicorn.poten;
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

  function lambert(kleur) {
    return new THREE.MeshLambertMaterial({ color: kleur });
  }

  function addBol(parent, r, mat, x, y, z, sx, sy, sz) {
    var m = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), mat);
    m.position.set(x, y, z);
    m.scale.set(sx || 1, sy || 1, sz || 1);
    m.castShadow = true;
    parent.add(m);
    return m;
  }

  function addDoos(parent, w, h, d, mat, x, y, z) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    parent.add(m);
    return m;
  }

  function addKegel(parent, r, h, mat, x, y, z, rx, rz) {
    var m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 12), mat);
    m.position.set(x, y, z);
    if (rx) m.rotation.x = rx;
    if (rz) m.rotation.z = rz;
    m.castShadow = true;
    parent.add(m);
    return m;
  }

  function addCilinder(parent, rt, rb, h, mat, x, y, z, rx, rz) {
    var m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 12), mat);
    m.position.set(x, y, z);
    if (rx) m.rotation.x = rx;
    if (rz) m.rotation.z = rz;
    m.castShadow = true;
    parent.add(m);
    return m;
  }

  function addOgen(body, x, y, z, r, kleur) {
    var mat = lambert(kleur || 0x222222);
    [-1, 1].forEach(function (z1) {
      var oog = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mat);
      oog.position.set(z1 * x, y, z);
      body.add(oog);
    });
  }

  function addOren(body, mat, x, y, z, r, h, tilt) {
    [-1, 1].forEach(function (z1) {
      var oor = new THREE.Mesh(new THREE.ConeGeometry(r, h, 10), mat);
      oor.position.set(z1 * x, y, z);
      oor.rotation.z = -z1 * tilt;
      oor.castShadow = true;
      body.add(oor);
    });
  }

  function maakPoten(body, posities, lengte, breedte, matVacht, matHoef) {
    var poten = [];
    posities.forEach(function (p) {
      var poot = new THREE.Group();
      poot.position.set(p[0], p[1], p[2]);
      var been = new THREE.Mesh(new THREE.CylinderGeometry(breedte * 0.45, breedte * 0.38, lengte, 10), matVacht);
      been.position.y = -lengte / 2;
      been.castShadow = true;
      poot.add(been);
      var onder = new THREE.Mesh(new THREE.CylinderGeometry(breedte * 0.5, breedte * 0.52, lengte * 0.2, 10), matHoef);
      onder.position.y = -lengte + lengte * 0.1;
      poot.add(onder);
      body.add(poot);
      poten.push(poot);
    });
    return poten;
  }

  function maakPaardachtig(body, vacht, manenKleuren, staartKleur, hoefKleur, metHoorn) {
    addBol(body, 0.85, vacht, 0, 1.2, 0, 0.85, 0.78, 1.6);
    addBol(body, 0.42, vacht, 0, 1.85, 0.72, 0.7, 1.1, 0.8);
    addBol(body, 0.36, vacht, 0, 2.15, 1.05, 0.75, 0.7, 1.0);
    addBol(body, 0.22, vacht, 0, 2.0, 1.45, 0.75, 0.55, 1.2);
    if (metHoorn) {
      addKegel(body, 0.13, 0.8, lambert(0xffd700), 0, 2.55, 0.98, -0.12, 0);
    }
    addOren(body, vacht, 0.2, 2.5, 0.92, 0.11, 0.38, 0.3);
    addOgen(body, 0.19, 2.22, 1.28, 0.065);
    manenKleuren.forEach(function (kleur, i) {
      addBol(body, 0.24 - i * 0.03, lambert(kleur), 0, 2.42 - i * 0.24, 0.72 - i * 0.3);
    });
    addKegel(body, 0.2, 0.85, lambert(staartKleur), 0, 1.3, -1.35, Math.PI * 0.62, 0);
    return maakPoten(body, [[-0.36, 0.95, 0.7], [0.36, 0.95, 0.7], [-0.36, 0.95, -0.7], [0.36, 0.95, -0.7]], 0.95, 0.2, vacht, lambert(hoefKleur));
  }

  function maakDier(type) {
    var group = new THREE.Group();
    var body = new THREE.Group();
    group.add(body);
    var poten = [];

    if (type === "paard") {
      poten = maakPaardachtig(body, lambert(0xa06a3c), [0x4a2f18, 0x5d3a20, 0x4a2f18], 0x4a2f18, 0x3d2b1a, false);
      group.scale.set(1.05, 1.12, 1.05);
    } else if (type === "otter") {
      var bruin = lambert(0x8b5e34);
      var licht = lambert(0xd2a878);
      addBol(body, 0.6, bruin, 0, 0.55, -0.05, 0.85, 0.62, 1.8);
      addBol(body, 0.33, bruin, 0, 0.88, 0.85, 0.9, 0.85, 1);
      addBol(body, 0.17, licht, 0, 0.78, 1.18, 0.85, 0.65, 1.1);
      addOgen(body, 0.16, 0.95, 1.05, 0.06);
      [-1, 1].forEach(function (z1) {
        addBol(body, 0.11, bruin, z1 * 0.22, 1.18, 0.78);
      });
      addCilinder(body, 0.17, 0.04, 1.0, bruin, 0, 0.5, -1.05, Math.PI * 0.42, 0);
      poten = maakPoten(body, [[-0.28, 0.38, 0.5], [0.28, 0.38, 0.5], [-0.28, 0.38, -0.55], [0.28, 0.38, -0.55]], 0.38, 0.15, bruin, lambert(0x5d3f22));
      group.scale.setScalar(0.85);
    } else if (type === "konijn") {
      var wit = lambert(0xf2f2f2);
      var roze = lambert(0xf5b8c4);
      addBol(body, 0.44, wit, 0, 0.55, -0.1, 0.85, 0.8, 1.45);
      addBol(body, 0.28, wit, 0, 0.88, 0.55, 0.9, 0.9, 1);
      addBol(body, 0.12, wit, 0, 0.8, 0.88, 0.85, 0.65, 1.1);
      addOgen(body, 0.13, 0.95, 0.78, 0.055);
      [-1, 1].forEach(function (z1) {
        var oor = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.55, 10), wit);
        oor.position.set(z1 * 0.12, 1.42, 0.5);
        oor.rotation.z = -z1 * 0.12;
        oor.rotation.x = -0.12;
        oor.castShadow = true;
        body.add(oor);
        addBol(body, 0.045, roze, z1 * 0.12, 1.4, 0.54);
      });
      addBol(body, 0.07, roze, 0, 0.8, 0.99);
      addBol(body, 0.16, lambert(0xffffff), 0, 0.62, -0.78);
      poten = maakPoten(body, [[-0.18, 0.4, 0.35], [0.18, 0.4, 0.35], [-0.22, 0.42, -0.5], [0.22, 0.42, -0.5]], 0.4, 0.12, wit, roze);
      group.scale.setScalar(0.9);
    } else if (type === "kat") {
      var oranje = lambert(0xf0932b);
      var witK = lambert(0xffffff);
      addBol(body, 0.36, oranje, 0, 0.5, 0, 0.8, 0.7, 1.55);
      addBol(body, 0.25, oranje, 0, 0.8, 0.55, 0.9, 0.85, 1);
      addBol(body, 0.13, witK, 0, 0.72, 0.84, 0.85, 0.65, 1.1);
      addOren(body, oranje, 0.15, 1.06, 0.48, 0.09, 0.24, 0.15);
      addOgen(body, 0.12, 0.86, 0.76, 0.05, 0x1e6b3a);
      [-1, 1].forEach(function (z1) {
        for (var i = 0; i < 3; i++) {
          addCilinder(body, 0.008, 0.006, 0.34, witK, z1 * 0.3, 0.74 - i * 0.03, 0.86, 0, -z1 * Math.PI / 2);
        }
      });
      addCilinder(body, 0.05, 0.025, 0.85, oranje, 0, 0.85, -0.8, Math.PI * 0.38, 0);
      poten = maakPoten(body, [[-0.15, 0.34, 0.4], [0.15, 0.34, 0.4], [-0.15, 0.34, -0.42], [0.15, 0.34, -0.42]], 0.34, 0.09, oranje, witK);
      group.scale.setScalar(0.85);
    } else if (type === "varken") {
      var rozeV = lambert(0xf4a7b9);
      var donkerRoze = lambert(0xe07a9a);
      addBol(body, 0.5, rozeV, 0, 0.6, 0, 0.9, 0.85, 1.35);
      addBol(body, 0.34, rozeV, 0, 0.72, 0.62, 0.9, 0.9, 1);
      addCilinder(body, 0.16, 0.16, 0.14, donkerRoze, 0, 0.7, 0.98, Math.PI / 2, 0);
      addOren(body, rozeV, 0.2, 1.06, 0.5, 0.1, 0.2, 0.45);
      addOgen(body, 0.16, 0.8, 0.9, 0.05);
      var krul = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.03, 8, 14), donkerRoze);
      krul.position.set(0, 0.78, -0.75);
      body.add(krul);
      poten = maakPoten(body, [[-0.2, 0.38, 0.45], [0.2, 0.38, 0.45], [-0.2, 0.38, -0.48], [0.2, 0.38, -0.48]], 0.38, 0.13, rozeV, donkerRoze);
      group.scale.setScalar(0.9);
    } else if (type === "axolotl") {
      var bleek = lambert(0xf9d3da);
      var kieuw = lambert(0xe8607c);
      addBol(body, 0.4, bleek, 0, 0.4, -0.1, 0.85, 0.62, 1.8);
      addDoos(body, 0.6, 0.32, 0.55, bleek, 0, 0.45, 0.6);
      addOgen(body, 0.17, 0.52, 0.82, 0.05);
      [-1, 1].forEach(function (z1) {
        for (var i = 0; i < 3; i++) {
          addKegel(body, 0.07, 0.32, kieuw, z1 * 0.32, 0.62 - i * 0.09, 0.5 - i * 0.12, 0.25, -z1 * (Math.PI / 2 - 0.2));
        }
      });
      addDoos(body, 0.08, 0.28, 0.75, kieuw, 0, 0.38, -0.9);
      poten = maakPoten(body, [[-0.18, 0.24, 0.4], [0.18, 0.24, 0.4], [-0.18, 0.24, -0.5], [0.18, 0.24, -0.5]], 0.24, 0.08, bleek, kieuw);
      group.scale.setScalar(0.8);
    } else {
      poten = maakPaardachtig(body, lambert(0xffffff), [0xff7ad9, 0xa06bff, 0x40e0d0], 0x40e0d0, 0xa06bff, true);
    }

    return { group: group, body: body, poten: poten };
  }

  var huidigDier = "eenhoorn";

  function setDier(type) {
    scene.remove(unicorn.group);
    unicorn = maakDier(type);
    unicornBody = unicorn.body;
    poten = unicorn.poten;
    huidigDier = type;
    scene.add(unicorn.group);
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
    var grootte = letter.length > 1 ? 62 : 88;
    ctx.font = "bold " + grootte + "px 'Comic Sans MS', 'Chalkboard SE', sans-serif";
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
    var materiaal = new THREE.MeshLambertMaterial({ map: maakLetterTextuur(letter, kleur) });
    var blok = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), materiaal);
    blok.castShadow = true;
    return blok;
  }

  function maakLetterBlokjes() {
    var letters = doelLetters.slice();
    var afleiding = [];
    var aantalAfleiding = 2 + Math.floor(Math.random() * 2);
    while (afleiding.length < aantalAfleiding) {
      var l = ALFABET[Math.floor(Math.random() * ALFABET.length)];
      if (huidigWoord.woord.indexOf(l) === -1 && afleiding.indexOf(l) === -1) {
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
    doelLetters = letterGroepen(huidigWoord.woord);
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
    if (letter.length > 1) dot.style.fontSize = "0.95rem";
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
      if (d < 1.3 * Math.max(unicorn.group.scale.x, 0.6)) {
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

  var geselecteerdKarakter = "eenhoorn";

  Array.prototype.forEach.call(document.querySelectorAll(".karakter-knop"), function (knop) {
    knop.addEventListener("click", function () {
      geselecteerdKarakter = knop.getAttribute("data-karakter");
      Array.prototype.forEach.call(document.querySelectorAll(".karakter-knop"), function (k) {
        k.classList.toggle("geselecteerd", k === knop);
      });
    });
  });

  function updateBeweging(dt) {
    var voor = new THREE.Vector3(Math.sin(camHeading), 0, Math.cos(camHeading));
    var rechts = new THREE.Vector3(-voor.z, 0, voor.x);
    var ix = (toetsen.rechts ? 1 : 0) - (toetsen.links ? 1 : 0);
    var iz = (toetsen.omhoog ? 1 : 0) - (toetsen.omlaag ? 1 : 0);
    var mx = rechts.x * ix + voor.x * iz;
    var mz = rechts.z * ix + voor.z * iz;
    var bewegend = mx !== 0 || mz !== 0;
    if (bewegend && !vieringActief) {
      var doelHoek = Math.atan2(mx, mz);
      var diff = doelHoek - heading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      heading += diff * Math.min(1, dt * 10);
      var camDiff = heading - camHeading;
      while (camDiff > Math.PI) camDiff -= Math.PI * 2;
      while (camDiff < -Math.PI) camDiff += Math.PI * 2;
      camHeading += camDiff * Math.min(1, dt * 2.5);
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

    var dierSchaal = Math.max(unicorn.group.scale.x, 0.6);
    var camDoel = new THREE.Vector3(
      unicorn.group.position.x - Math.sin(camHeading) * 8 * dierSchaal,
      5 * dierSchaal,
      unicorn.group.position.z - Math.cos(camHeading) * 8 * dierSchaal
    );
    camera.position.lerp(camDoel, Math.min(1, dt * 4));
    camera.lookAt(unicorn.group.position.x, 1 + dierSchaal, unicorn.group.position.z);
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
    if (geselecteerdKarakter !== huidigDier) {
      setDier(geselecteerdKarakter);
    }
    nieuwWoord();
  });

  initScene();
  animate();
})();

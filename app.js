'use strict';

const albums = [
  {
    name: 'Terres de brume', country: 'Islande', letter: 'A',
    pages: [
      ['brume', 'Une pluie suspendue', 'Le grondement de l’eau arrive bien avant les premières gouttes sur les joues.', 'Une cascade immense dévale une falaise dans un nuage de gouttelettes.'],
      ['rivage', 'Au bord de l’encre', 'À chaque vague, l’écume dessine une nouvelle ligne sur le sable noir.', 'Vue aérienne des vagues qui bordent une plage de sable noir.'],
      ['nuit', 'Quand le ciel danse', 'Encore un instant les yeux levés. Tu reconnais ce ciel ?', 'Des voiles de lumière verte ondulent dans le ciel nocturne.']
    ]
  },
  {
    name: 'Reflets du Nord', country: 'Norvège', letter: 'B',
    pages: [
      ['horizon', 'Entre ciel et mer', 'D’ici, on peut suivre du regard le chemin de l’eau entre les sommets.', 'Des bras de mer bleus serpentent entre de hauts sommets rocheux.'],
      ['cabanes', 'La couleur du port', 'Un peu de rouge au bord de l’eau. On s’arrêterait bien ici pour la nuit.', 'Des maisons de pêcheurs rouges se serrent au pied des montagnes.'],
      ['neige', 'Le silence blanc', 'La neige s’est posée sur les crêtes. As-tu reconnu ces montagnes ?', 'Des cabanes au bord de la mer sous un sommet enneigé.']
    ]
  }
];

const byId = id => document.getElementById(id);
const viewer = byId('viewer');
const spinButton = byId('spin-button');
const cards = [...document.querySelectorAll('.album-card')];
let selected = albums[0];
let page = 0;
let returnFocus;
let spinPhase = 'idle';
let stopClicks = 0;
let spinTimer;
let motion;
let chosenIndex;
const wheel = byId('wheel');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

function spinMessage(label, status) {
  spinButton.querySelector('span').textContent = label;
  byId('status').querySelector('span').textContent = status;
}

function renderPage() {
  const end = page === selected.pages.length;
  const [file, title, note, alt] = selected.pages[end ? 0 : page];
  byId('photo').src = 'photos/' + file + '.jpg';
  byId('photo').alt = alt;
  byId('page-label').textContent = end ? 'POUR TES 30 ANS' : 'PHOTOGRAPHIE ' + (page + 1) + ' / ' + selected.pages.length;
  byId('caption').textContent = end ? 'Un voyage en ' + selected.country + ' !' : title;
  byId('note').textContent = end ? 'Joyeux anniversaire, Manon ! Ces paysages, tu vas les découvrir pour de vrai.' : note;
  byId('prev').disabled = page === 0;
  byId('next').textContent = end ? 'Retour à la roulette' : page === selected.pages.length - 1 ? 'Tourner la dernière page' : 'Suivante';
  byId('progress').replaceChildren(...Array.from({ length: selected.pages.length + 1 }, (_, i) => {
    const dot = document.createElement('i');
    dot.classList.toggle('active', i === page);
    return dot;
  }));
}

function openAlbum(index, opener) {
  selected = albums[index];
  returnFocus = opener;
  page = 0;
  byId('album-name').textContent = 'Album ' + selected.letter + ' · ' + selected.name;
  renderPage();
  viewer.showModal();
  byId('next').focus();
}

function wheelAngle() {
  const matrix = new DOMMatrix(getComputedStyle(wheel).transform);
  return (Math.atan2(matrix.b, matrix.a) * 180 / Math.PI + 360) % 360;
}

function finishSpin() {
  spinPhase = 'stopping';
  spinButton.disabled = true;
  spinMessage('La roue ralentit…', 'Encore un instant avant la première photo…');
  const start = wheelAngle();
  const target = (chosenIndex === 0 ? 90 : 270) + (Math.random() - 0.5) * 40;
  const end = start + 720 + (target - start + 360) % 360;
  motion?.cancel();
  wheel.style.transform = 'rotate(' + target + 'deg)';
  motion = wheel.animate(
    [{ transform: 'rotate(' + start + 'deg)' }, { transform: 'rotate(' + end + 'deg)' }],
    { duration: reducedMotion.matches ? 1 : 4400, easing: 'cubic-bezier(.23,.60,.34,1)' }
  );
  motion.onfinish = () => {
    spinPhase = 'idle';
    spinButton.disabled = false;
    cards.forEach(card => { card.disabled = false; });
    spinMessage('Faire tourner la roue', 'La roue a choisi l’album ' + albums[chosenIndex].letter + '.');
    openAlbum(chosenIndex, spinButton);
  };
}

function pressSpin() {
  if (spinPhase === 'stopping') return;
  if (spinPhase === 'endless') {
    stopClicks++;
    if (stopClicks === 3) { finishSpin(); return; }
    spinMessage(stopClicks === 1 ? 'Insister un peu' : 'Un dernier clic !', stopClicks === 1 ? 'Elle fait semblant de ne pas t’entendre…' : 'Promis, cette fois elle écoute.');
    return;
  }
  if (spinPhase === 'turning') {
    clearTimeout(spinTimer);
    spinPhase = 'endless';
    stopClicks = 0;
    spinMessage('Arrêter la roue', 'Mode sans fin découvert ! À toi de la convaincre de s’arrêter.');
    return;
  }
  chosenIndex = Math.random() < 0.9 ? 0 : 1;
  spinPhase = 'turning';
  cards.forEach(card => { card.disabled = true; });
  spinMessage('Encore un tour ?', 'La roue tourne. Laisse-la choisir…');
  const start = wheelAngle();
  if (!reducedMotion.matches) {
    motion = wheel.animate(
      [{ transform: 'rotate(' + start + 'deg)' }, { transform: 'rotate(' + (start + 360) + 'deg)' }],
      { duration: 730, iterations: Infinity }
    );
  }
  spinTimer = setTimeout(finishSpin, reducedMotion.matches ? 1500 : 4800);
}

spinButton.addEventListener('click', pressSpin);

cards.forEach(card => card.addEventListener('click', () => openAlbum(Number(card.dataset.album), card)));
byId('prev').addEventListener('click', () => {
  if (page > 0) { page--; renderPage(); }
});
byId('next').addEventListener('click', () => {
  if (page === selected.pages.length) { returnFocus = spinButton; viewer.close(); spinButton.focus(); return; }
  page++;
  renderPage();
});
byId('close').addEventListener('click', () => viewer.close());
viewer.addEventListener('close', () => returnFocus?.focus({ preventScroll: true }));
viewer.addEventListener('click', event => { if (event.target === viewer) viewer.close(); });
viewer.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') byId('prev').click();
  if (event.key === 'ArrowRight' && page < selected.pages.length) byId('next').click();
});

const navLinks = document.querySelectorAll('nav a');
function updateNav() {
  const albumsVisible = window.scrollY > 5 && byId('albums').getBoundingClientRect().top < window.innerHeight * .75;
  navLinks.forEach((link, i) => link.classList.toggle('current', i === Number(albumsVisible)));
}
window.addEventListener('scroll', updateNav, { passive: true });
updateNav();

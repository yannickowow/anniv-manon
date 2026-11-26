'use strict';

const albums = [
  {
    name: 'Terres de brume', country: 'Islande',
    pages: [
      ['brume', 'Une pluie suspendue', 'Le grondement de l’eau arrive bien avant les premières gouttes sur les joues.', 'Une cascade immense dévale une falaise dans un nuage de gouttelettes.'],
      ['rivage', 'Au bord de l’encre', 'À chaque vague, l’écume dessine une nouvelle ligne sur le sable noir.', 'Vue aérienne des vagues qui bordent une plage de sable noir.'],
      ['nuit', 'Quand le ciel danse', 'Encore un instant les yeux levés. Tu reconnais ce ciel ?', 'Des voiles de lumière verte ondulent dans le ciel nocturne.']
    ]
  },
  {
    name: 'Reflets du Nord', country: 'Norvège',
    pages: [
      ['horizon', 'Entre ciel et mer', 'D’ici, on peut suivre du regard le chemin de l’eau entre les sommets.', 'Des bras de mer bleus serpentent entre de hauts sommets rocheux.'],
      ['cabanes', 'La couleur du port', 'Un peu de rouge au bord de l’eau. On s’arrêterait bien ici pour la nuit.', 'Des maisons de pêcheurs rouges se serrent au pied des montagnes.'],
      ['neige', 'Le silence blanc', 'La neige s’est posée sur les crêtes. As-tu reconnu ces montagnes ?', 'Des cabanes au bord de la mer sous un sommet enneigé.']
    ]
  }
];

const anniversaryAlbum = {
  name: 'BMW M5 · 30 Jahre',
  pages: [
    ['m5-27', 'La M5 en trois-quarts arrière', '© BMW Group', 'La berline gris mat vue de trois-quarts arrière, avec ses quatre sorties d’échappement.'],
    ['m5-30', 'La signature sur le seuil', '© BMW Group', 'L’inscription « 30 Jahre M5 » sur le seuil de porte, aux couleurs de BMW M.'],
    ['m5-31', 'À bord de la 30 Jahre', '© BMW Group', 'Les deux sièges avant noirs portent la broderie blanche « 30 Jahre M5 ».']
  ]
};

const byId = id => document.getElementById(id);
const viewer = byId('viewer');
const spinButton = byId('spin-button');
const cards = [...document.querySelectorAll('.album-card')];
let selected = albums[0];
let page = 0;
let returnFocus;
let spinPhase = 'idle';
let motion;
const wheel = byId('wheel');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

function spinMessage(label, status) {
  spinButton.querySelector('span').textContent = label;
  byId('status').querySelector('span').textContent = status;
}

function lastPage() {
  return selected.country ? selected.pages.length : selected.pages.length - 1;
}

function renderPage() {
  const end = page === selected.pages.length;
  const [file, title, note, alt] = selected.pages[end ? 0 : page];
  byId('photo').src = 'photos/' + file + '.jpg';
  byId('photo').alt = alt;
  byId('page-label').textContent = end ? 'POUR TES 30 JAHRE' : 'PHOTOGRAPHIE ' + (page + 1) + ' / ' + selected.pages.length;
  byId('caption').textContent = end ? 'Un voyage en ' + selected.country + ' !' : title;
  byId('note').textContent = end ? 'Joyeux anniversaire, Manon ! Ces paysages, tu vas les découvrir pour de vrai.' : note;
  byId('prev').disabled = page === 0;
  let nextLabel = 'Suivante';
  if (page === lastPage()) nextLabel = selected.country ? 'Retour à la roulette' : 'Fermer l’album';
  else if (selected.country && page + 1 === lastPage()) nextLabel = 'Tourner la dernière page';
  byId('next').textContent = nextLabel;
  byId('progress').replaceChildren(...Array.from({ length: lastPage() + 1 }, (_, i) => {
    const dot = document.createElement('i');
    dot.classList.toggle('active', i === page);
    return dot;
  }));
}

function openAlbum(album, opener) {
  selected = album;
  returnFocus = opener;
  page = 0;
  viewer.classList.toggle('anniversary', album === anniversaryAlbum);
  byId('album-name').textContent = album.name;
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
  const chosenIndex = Math.random() < 0.9 ? 0 : 1;
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
    spinMessage('Faire tourner la roue', 'La roue a choisi « ' + albums[chosenIndex].name + ' ».');
    byId('jahre').disabled = false;
    openAlbum(albums[chosenIndex], spinButton);
  };
}

function pressSpin() {
  if (spinPhase === 'stopping') return;
  if (spinPhase === 'turning') {
    finishSpin();
    return;
  }
  spinPhase = 'turning';
  byId('jahre').disabled = true;
  cards.forEach(card => { card.disabled = true; });
  spinMessage('Arrêter la roue', 'La roue tourne…');
  const start = wheelAngle();
  if (!reducedMotion.matches) {
    motion = wheel.animate(
      [{ transform: 'rotate(' + start + 'deg)' }, { transform: 'rotate(' + (start + 360) + 'deg)' }],
      { duration: 730, iterations: Infinity }
    );
  }
}

spinButton.addEventListener('click', pressSpin);

byId('jahre').addEventListener('click', event => openAlbum(anniversaryAlbum, event.currentTarget));
cards.forEach(card => card.addEventListener('click', () => openAlbum(albums[Number(card.dataset.album)], card)));
byId('prev').addEventListener('click', () => {
  if (page > 0) { page--; renderPage(); }
});
byId('next').addEventListener('click', () => {
  if (page === lastPage()) {
    if (selected.country) returnFocus = spinButton;
    viewer.close();
    return;
  }
  page++;
  renderPage();
});
byId('close').addEventListener('click', () => viewer.close());
viewer.addEventListener('close', () => returnFocus?.focus({ preventScroll: true }));
viewer.addEventListener('click', event => { if (event.target === viewer) viewer.close(); });
viewer.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') byId('prev').click();
  if (event.key === 'ArrowRight' && page < lastPage()) byId('next').click();
});

const navLinks = document.querySelectorAll('nav a');
function updateNav() {
  const albumsVisible = window.scrollY > 5 && byId('albums').getBoundingClientRect().top < window.innerHeight * .75;
  navLinks.forEach((link, i) => link.classList.toggle('current', i === Number(albumsVisible)));
}
window.addEventListener('scroll', updateNav, { passive: true });
updateNav();

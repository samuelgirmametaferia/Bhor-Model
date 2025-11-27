import { buildPeriodicGrid, fillFactPanel, findElementByNumber, markSelected } from './ui.js';
import { loadElements } from './data.js';

// We'll dynamically import AtomViewer module depending on whether bare imports like 'three' resolve.
let AtomViewer = null;
async function loadAtomModule(){
  try{
    await import('three');
    const mod = await import('./atom.js');
    AtomViewer = mod.AtomViewer;
  }catch(e){
    console.warn('Importing bare specifier "three" failed — falling back to UMD global:', e);
    // load UMD builds into global scope and import legacy module
    await loadScript('https://unpkg.com/three@0.155.0/build/three.min.js');
    await loadScript('https://unpkg.com/three@0.155.0/examples/js/controls/OrbitControls.js');
    const mod = await import('./atom.legacy.js');
    AtomViewer = mod.AtomViewer;
  }
}

function loadScript(src){
  return new Promise((resolve, reject)=>{
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

const canvas = document.getElementById('c');
let viewer = null;

let last = performance.now();
function animate(){
  const now = performance.now();
  const dt = (now - last)/1000;
  last = now;
  if(viewer) viewer.update(dt);
  requestAnimationFrame(animate);
}

// UI wiring
const ptGrid = document.getElementById('pt-grid');
let ELEMENTS = [];

// load atom module and data then build UI and start animation
async function init(){
  await loadAtomModule();
  if(!AtomViewer) throw new Error('Failed to load AtomViewer');
  viewer = new AtomViewer(canvas);
  try{
    const elements = await loadElements();
    ELEMENTS = elements;
    buildPeriodicGrid(ptGrid, (el)=> loadElement(el), ELEMENTS);
    if(ELEMENTS && ELEMENTS.length>0) loadElement(ELEMENTS[0]);
  }catch(err){
    console.error('Failed loading elements:', err);
    buildPeriodicGrid(ptGrid, (el)=> loadElement(el), []);
  }
  animate();
}
init().catch(err=>{ console.error('Initialization failed', err); });

const speedInput = document.getElementById('speed');
speedInput.addEventListener('input', ()=> { if(viewer) viewer.setSpeed(parseFloat(speedInput.value)); });

const toggleShells = document.getElementById('toggle-shells');
toggleShells.addEventListener('change', ()=> { if(viewer) viewer.toggleShells(toggleShells.checked); });

const realisticScale = document.getElementById('realistic-scale');
realisticScale.addEventListener('change', ()=> { if(viewer) viewer.setRealisticScale(realisticScale.checked); });

document.getElementById('load-btn').addEventListener('click', ()=>{
  const n = parseInt(document.getElementById('atomic-input').value, 10);
  if(!isNaN(n)){
    const el = findElementByNumber(ELEMENTS, n);
    if(el) loadElement(el);
  }
});

// support Enter in the atomic input
document.getElementById('atomic-input').addEventListener('keydown', (ev)=>{
  if(ev.key === 'Enter'){
    const n = parseInt(document.getElementById('atomic-input').value, 10);
    if(!isNaN(n)){
      const el = findElementByNumber(ELEMENTS, n);
      if(el) loadElement(el);
    }
  }
});

// next/prev buttons
document.getElementById('next-elem').addEventListener('click', ()=>{
  if(!viewer || !ELEMENTS.length) return;
  const idx = ELEMENTS.findIndex(e=>e.number===viewer.atomicNumber);
  const next = ELEMENTS[(idx+1) % ELEMENTS.length];
  if(next) loadElement(next, { hidePanel: window.getComputedStyle(document.getElementById('periodic')).display !== 'none' });
});
document.getElementById('prev-elem').addEventListener('click', ()=>{
  if(!viewer || !ELEMENTS.length) return;
  const idx = ELEMENTS.findIndex(e=>e.number===viewer.atomicNumber);
  const prev = ELEMENTS[(idx-1 + ELEMENTS.length) % ELEMENTS.length];
  if(prev) loadElement(prev, { hidePanel: window.getComputedStyle(document.getElementById('periodic')).display !== 'none' });
});

document.getElementById('random-elem').addEventListener('click', ()=>{
  if(!viewer || !ELEMENTS.length) return;
  const idx = Math.floor(Math.random() * ELEMENTS.length);
  loadElement(ELEMENTS[idx], { hidePanel: window.getComputedStyle(document.getElementById('periodic')).display !== 'none' });
});

// keyboard navigation - left/right arrows and n/p to select previous/next element
document.addEventListener('keydown', (ev)=>{
  if(document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
  if(!ELEMENTS.length) return;
  const key = ev.key;
  let handled = false;
  if(key === 'ArrowRight' || key.toLowerCase() === 'n'){
    handled = true;
    let idx = viewer ? ELEMENTS.findIndex(e=>e.number===viewer.atomicNumber) : 0;
    if(idx < 0) idx = 0;
    const next = ELEMENTS[(idx+1) % ELEMENTS.length];
    if(next) loadElement(next, { hidePanel: window.getComputedStyle(document.getElementById('periodic')).display !== 'none' });
  } else if(key === 'ArrowLeft' || key.toLowerCase() === 'p'){
    handled = true;
    let idx = viewer ? ELEMENTS.findIndex(e=>e.number===viewer.atomicNumber) : 0;
    if(idx < 0) idx = 0;
    const prev = ELEMENTS[(idx-1 + ELEMENTS.length) % ELEMENTS.length];
    if(prev) loadElement(prev, { hidePanel: window.getComputedStyle(document.getElementById('periodic')).display !== 'none' });
  } else if(key.toLowerCase() === 'r'){
    handled = true;
    const idx = Math.floor(Math.random() * ELEMENTS.length);
    loadElement(ELEMENTS[idx]);
  }
  if(handled){ ev.preventDefault(); }
});

document.getElementById('back-btn').addEventListener('click', ()=>{
  // toggle periodic panel visibility
  const periodic = document.getElementById('periodic');
  const visible = window.getComputedStyle(periodic).display !== 'none';
  periodic.style.display = visible ? 'none' : 'block';
});

document.getElementById('remove-e').addEventListener('click', ()=>{
  if(!viewer) return;
  viewer.electronCount = Math.max(0, viewer.electronCount - 1);
  // rebuild from last loaded element
  const el = findElementByNumber(ELEMENTS, viewer.atomicNumber);
  if(el) viewer.loadElement(Object.assign({}, el, { electrons: viewer.electronCount }));
});
document.getElementById('add-e').addEventListener('click', ()=>{
  if(!viewer) return;
  viewer.electronCount = Math.min(300, viewer.electronCount + 1);
  const el = findElementByNumber(ELEMENTS, viewer.atomicNumber);
  if(el) viewer.loadElement(Object.assign({}, el, { electrons: viewer.electronCount }));
});

function loadElement(el, { hidePanel = true } = {}){
  if(hidePanel) document.getElementById('periodic').style.display = 'none';
  fillFactPanel(el);
  viewer.loadElement(el, { realistic: realisticScale.checked, proportional: document.getElementById('proportional-distance').checked });
  // mark selected element in the periodic view
  markSelected(ptGrid, el.number);
}


// Animation is started after the viewer and elements are initialized

const GROUP_COLORS = {
  'Nonmetal':'#9be7a2',
  'Alkali Metal':'#ffb58a',
  'Alkaline Earth':'#ffd27f',
  'Noble Gas':'#c6dcff',
  'Halogen':'#ffd1ff',
  'Metalloid':'#f2d0a1',
  'Post-transition Metal':'#d0d0d0',
  'Transition Metal':'#9fb3ff',
};

export function buildPeriodicGrid(container, onSelect, elements){
  container.innerHTML = '';
  // add legend
  const legend = document.createElement('div');
  legend.className = 'legend';
  Object.entries(GROUP_COLORS).slice(0,6).forEach(([name,color])=>{
    const item = document.createElement('div'); item.className='legend-item';
    const dot = document.createElement('span'); dot.className='group-dot'; dot.style.background = color;
    const label = document.createElement('span'); label.textContent = name;
    item.appendChild(dot); item.appendChild(label); legend.appendChild(item);
  });
  container.appendChild(legend);

  for(const el of elements){
    const tile = document.createElement('div');
    tile.className = 'pt-tile';
    const sym = document.createElement('div'); sym.className = 'sym'; sym.textContent = el.symbol;
    const num = document.createElement('div'); num.className = 'num'; num.textContent = el.number;
    tile.appendChild(sym); tile.appendChild(num);
    tile.title = `${el.name} (${el.number})`;
    const color = GROUP_COLORS[el.group] || 'rgba(255,255,255,0.04)';
    tile.style.background = color;
    // grid placement using group number (col) and period (row)
    if(el.groupNumber){
      tile.style.gridColumnStart = el.groupNumber;
    } else if(el.group && el.group.toString().length<=3){
      // try to parse numeric group from string
      const val = parseInt(el.group);
      if(!isNaN(val)) tile.style.gridColumnStart = val;
    }
    if(el.period) tile.style.gridRowStart = el.period;
    // store element on tile
    tile.dataset.number = el.number;
    tile.dataset.config = el.econfig || '';
    tile.addEventListener('click', ()=> onSelect(el));
    // tooltip handling
    tile.addEventListener('mouseenter', (ev)=> showTooltip(ev, el));
    tile.addEventListener('mousemove', (ev)=> moveTooltip(ev));
    tile.addEventListener('mouseleave', hideTooltip);

    container.appendChild(tile);
  }
}

export function markSelected(container, number){
  const tiles = container.querySelectorAll('.pt-tile');
  tiles.forEach(t=> t.classList.toggle('selected', t.dataset.number==number));
  const node = container.querySelector(`.pt-tile[data-number='${number}']`);
  if(node){ node.scrollIntoView({block:'center', inline:'center', behavior:'smooth'}); }
}

export function fillFactPanel(el){
  const name = document.getElementById('elem-name');
  const info = document.getElementById('elem-info');
  name.textContent = `${el.name} — ${el.symbol}`;
  info.innerHTML = `
    <div><strong>Atomic #:</strong> ${el.number}</div>
    <div><strong>Mass #:</strong> ${el.mass || el.number}</div>
    <div><strong>Group/Period:</strong> ${el.group || '-'} / ${el.period || '-'}</div>
    <div><strong>Valence e⁻:</strong> ${el.valence || '-'}</div>
    <div><strong>Configuration:</strong> ${el.econfig || '-'}</div>
  `;
}

export function findElementByNumber(elements, n){
  return elements.find(e=>e.number===n) || null;
}

// simple tooltip for periodic tiles
let tooltipEl = null;
function ensureTooltip(){
  if(!tooltipEl){
    tooltipEl = document.getElementById('pt-tooltip');
    if(!tooltipEl){
      tooltipEl = document.createElement('div'); tooltipEl.className='pt-tooltip'; document.body.appendChild(tooltipEl);
    }
  }
}
function showTooltip(ev, el){
  ensureTooltip();
  tooltipEl.style.display='block';
  tooltipEl.innerHTML = `<strong>${el.name} (${el.symbol})</strong><br/><span class="hint">${el.econfig || ''}</span><br/><span class="hint">Valence: ${el.valence || '-'}</span>`;
  moveTooltip(ev);
}
function moveTooltip(ev){
  if(!tooltipEl) return;
  const x = ev.pageX + 12;
  const y = ev.pageY + 12;
  tooltipEl.style.left = x + 'px';
  tooltipEl.style.top = y + 'px';
}
function hideTooltip(){
  if(tooltipEl) tooltipEl.style.display='none';
}

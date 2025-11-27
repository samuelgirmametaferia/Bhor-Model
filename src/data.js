export async function loadElements(){
  const r = await fetch('/data/elements.json', { cache: 'no-store' });
  if(!r.ok) throw new Error('Failed to load elements.json: ' + r.status);
  return await r.json();
}

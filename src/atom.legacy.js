// Legacy Atom viewer that assumes THREE and OrbitControls are available on window
const THREE = window.THREE;
const OrbitControls = window.THREE?.OrbitControls || window.THREE?.Controls?.OrbitControls;

export class AtomViewer {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 5000);
    this.camera.position.set(0, 0, 60);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setClearColor(0x04060b);
    this.renderer.setPixelRatio(window.devicePixelRatio || 1);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 800;

    this.root = new THREE.Group();
    this.scene.add(this.root);

    this.electrons = [];
    this.shells = [];
    this.nucleus = null;
    this.atomicNumber = 1;
    this.electronCount = 1;
    this.time = 0;
    this.speed = 1;

    window.addEventListener('resize', () => this.onResize());
    this.onResize();
  }
  onResize(){
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w/h;
    this.camera.updateProjectionMatrix();
  }
  setSpeed(v){ this.speed = v }
  clear(){
    while(this.root.children.length) this.root.remove(this.root.children[0]);
    this.electrons = [];
    this.shells = [];
    this.nucleus = null;
  }
  loadElement(element, options = {}){
    const SHELL_CAPS = [2,8,18,32,50,72,98];
    this.atomicNumber = element.number;
    this.electronCount = element.electrons || element.number;
    this.clear();
    const realistic = !!options.realistic;
    const proportional = !!options.proportional;
    const nucleus = new THREE.Group();
    const pMat = new THREE.MeshStandardMaterial({ color:0xff4444 });
    const nMat = new THREE.MeshStandardMaterial({ color:0x4488ff });
    for(let i=0;i<element.protons;i++){
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.6,8,8), pMat);
      s.position.set((Math.random()-0.5)*1.2,(Math.random()-0.5)*1.2,(Math.random()-0.5)*1.2);
      nucleus.add(s);
    }
    for(let i=0;i<(element.neutrons||element.number);i++){
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.6,8,8), nMat);
      s.position.set((Math.random()-0.5)*1.2,(Math.random()-0.5)*1.2,(Math.random()-0.5)*1.2);
      nucleus.add(s);
    }
    nucleus.scale.setScalar(realistic ? 0.6 : 1.0);
    this.nucleus = nucleus;
    this.root.add(nucleus);
    const light = new THREE.PointLight(0xffffff, 1.2);
    light.position.set(50,50,50);
    this.scene.add(light);
    const amb = new THREE.AmbientLight(0x404040, 0.9);
    this.scene.add(amb);
    const shells = [];
    let remaining = this.electronCount;
    for(let i=0;i<SHELL_CAPS.length && remaining>0;i++){
      const cap = SHELL_CAPS[i];
      const take = Math.min(cap, remaining);
      shells.push(take);
      remaining -= take;
    }
    const baseRadius = proportional ? 6 : 12;
    for(let i=0;i<shells.length;i++){
      const r = baseRadius + i*6 + (proportional? i*3:0);
      const geom = new THREE.RingGeometry(r-0.02, r+0.02, 64);
      const mat = new THREE.MeshBasicMaterial({ color: 0x33aaff, side: THREE.DoubleSide, transparent:true, opacity:0.12 });
      const ring = new THREE.Mesh(geom, mat);
      ring.rotation.x = Math.PI/2;
      this.shells.push({mesh:ring, radius:r});
      this.root.add(ring);
      const count = shells[i];
      for(let j=0;j<count;j++){
        const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.5,12,12), new THREE.MeshStandardMaterial({ emissive:0xffffee, emissiveIntensity:0.6, color:0xffffff }));
        this.root.add(sphere);
        this.electrons.push({mesh:sphere, shellIndex:i, angle: (j/count)*Math.PI*2, radius:r, speed: (0.6 + (i+1)*0.12) });
      }
    }
  }
  toggleShells(visible){ this.shells.forEach(s=> s.mesh.visible = visible); }
  setRealisticScale(enabled){ if(!this.nucleus) return; this.nucleus.scale.setScalar(enabled? 0.2 : 1.0); }
  update(dt){
    this.time += dt * this.speed;
    if(this.nucleus){
      const v = Math.sin(this.time*2)*0.08;
      this.nucleus.rotation.y += 0.002 * this.speed;
      this.nucleus.position.y = v;
    }
    for(const e of this.electrons){
      e.angle += dt* (e.speed) * 0.6 * this.speed;
      const a = e.angle;
      const r = e.radius;
      const incl = (e.shellIndex%3)*0.15;
      e.mesh.position.set(Math.cos(a)*r, Math.sin(a)*r*incl + Math.sin(a*0.4)*0.2, Math.sin(a)*r);
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

// DAVID_AI — single-file Vercel serverless application
// Deploy this file as: api/index.js
// Add OPENAI_API_KEY in Vercel Project Settings -> Environment Variables.
// Never put the key in this file or in the browser.

const MODEL = process.env.OPENAI_MODEL || "gpt-5.6-luna";
const MAX = 12000;
const rate = new Map();

const departments = {
  CSE:["CPU","GPU","RAM","ROM","Microcontroller","FPGA","Network Switch","Sensor","Database Node","AI Accelerator"],
  EEE:["Resistor","Capacitor","Inductor","Diode","MOSFET","BJT","Transformer","Relay","Motor","Generator","Battery","Solar Panel"],
  ECE:["NAND Gate","AND Gate","OR Gate","NOT Gate","Op-Amp","ADC","DAC","Antenna","RF Module","Oscillator","PCB"],
  FT:["Pump","Valve","Pipe","Reservoir","Heat Exchanger","Flow Meter","Pressure Sensor","Nozzle"],
  CIVIL:["Beam","Column","Slab","Foundation","Bridge Joint","Road","Pipeline","Tank","Dam","Crane","Concrete Block"],
  MECH:["Gear","Shaft","Bearing","Spring","Hydraulic Cylinder","Piston","Compressor","Turbine","Fan","Brake"],
  AUTOMOBILE:["Engine","Transmission","Differential","Wheel","Brake","Suspension","Radiator","Fuel Tank","Battery","ECU","Exhaust"],
  AEROSPACE:["Airframe","Wing","Flap","Rudder","Jet Engine","Fuel Tank","Landing Gear","Avionics","Radar","Propeller"],
  SPACECRAFT:["Payload","Solar Array","Thruster","Reaction Wheel","Star Tracker","Telemetry","Antenna","Fuel Tank","Docking Port"],
  FLUID:["Pipe","Pump","Valve","Venturi","Nozzle","Reservoir","Flow Meter","Pressure Tap","Bernoulli Section"],
  SCIENCE:["Mass","Spring","Pendulum","Magnet","Electroscope","Heat Source","Lens","Prism","Particle Source"],
  CHEMISTRY:["Reactor","Mixer","Beaker","Heat Bath","Condenser","Distillation Column","pH Sensor","Gas Line"],
  BIOLOGY:["Cell Model","Incubator","Microscope","Culture Vessel","Sensor","Pump","Filter"],
  NANOTECH:["Nanowire","Nanotube","Thin Film","MEMS Sensor","Nanoelectrode","Microfluidic Channel"],
  QUANTUM:["Qubit","Quantum Gate","Cryogenic Stage","Photon Source","Detector","Readout"],
};

const SYSTEM = `You are DAVID_AI, a neutral engineering prototype assistant.
Return ONLY JSON:
{"reply":"string","actions":[{"type":"add|remove|move|rotate|connect|split|fix|run|check|showall|zoom|pan|center|duplicate|align|measure|reset","name":"string","target":"string","source":"string","x":0,"y":0,"angle":0,"value":0}],"model":{"name":"string"}}
Interpret natural language commands for conceptual engineering design.
Use realistic component names from engineering departments.
For automobiles, include real subsystems such as engine, transmission, differential,
wheels, brakes, suspension, radiator, ECU and fuel/electrical systems when requested.
For fluid mechanics recognize pipes, pumps, valves, venturi and Bernoulli sections.
For civil, aerospace, spacecraft, electronics and computing use appropriate real components.
Preserve existing state conceptually. "split" separates the selected part. "fix" locks it.
"show all" makes hidden/separated parts visible. "rotate", "zoom", "pan", "center", "duplicate", "align", "measure", and "reset" are visual/model actions.
When asked to connect parts, create a connect action with source and target. When asked to add a realistic system, choose appropriate library-style parts and connect them logically.
Never claim physical hardware has been verified. Simulation is conceptual unless measured data exists.
Never expose secrets or execute arbitrary computer commands.`;

function send(res,status,obj){
  res.status(status);
  res.setHeader("Content-Type","application/json; charset=utf-8");
  res.setHeader("Cache-Control","no-store");
  res.setHeader("X-Content-Type-Options","nosniff");
  res.setHeader("Referrer-Policy","no-referrer");
  res.setHeader("X-Frame-Options","DENY");
  res.setHeader("Permissions-Policy","camera=(self), microphone=(self), geolocation=(), usb=()");
  res.end(JSON.stringify(obj));
}
function rateOk(ip){
  const now=Date.now(), old=rate.get(ip);
  if(!old || now-old.t>60000){rate.set(ip,{t:now,n:1});return true}
  old.n++;return old.n<=20;
}
function clean(s,n){return String(s??"").replace(/\0/g,"").slice(0,n)}
function extract(s){
  try{return JSON.parse(s)}catch{}
  const m=String(s).match(/\{[\s\S]*\}/);try{return m?JSON.parse(m[0]):null}catch{return null}
}

const page = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>DAVID_AI Engineering Workspace</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#030713;color:#eaf6ff;font:14px Segoe UI,Arial;overflow:hidden}
:root{--c:#54e8ff;--b:#688dff;--g:#5af0b0;--p:#09152b;--l:#18375a;--m:#7892ae}
.app{height:100vh;display:grid;grid-template-rows:64px 1fr}.top{display:flex;align-items:center;justify-content:space-between;padding:0 20px;border-bottom:1px solid var(--l);background:#040916e8}
.logo{display:flex;align-items:center;gap:10px;font-weight:800;letter-spacing:2px}.orb{width:38px;height:38px;border:1px solid var(--c);border-radius:50%;display:grid;place-items:center;color:var(--c);box-shadow:0 0 25px #54e8ff33}.status{font-size:10px;color:var(--m)}.dot{display:inline-block;width:7px;height:7px;background:var(--g);border-radius:50%;box-shadow:0 0 10px var(--g)}
.body{display:grid;grid-template-columns:205px 1fr 280px;min-height:0}.left,.right{background:#040a17;border-right:1px solid var(--l);padding:12px}.right{border-left:1px solid var(--l);border-right:0}
.nav{width:100%;padding:11px;margin-bottom:6px;border:1px solid transparent;border-radius:10px;background:transparent;color:var(--m);text-align:left}.nav:hover,.nav.on{color:white;background:#54e8ff0c;border-color:var(--l)}
main{padding:16px;min-width:0;overflow:auto}.hero{display:flex;justify-content:space-between;gap:15px}.hero h1{margin:0;font-size:27px}.hero p{color:var(--m);margin:5px 0 14px}.badges span{display:inline-block;border:1px solid var(--l);padding:6px 8px;border-radius:20px;color:var(--m);font-size:9px;margin:2px}
.workspace{display:grid;grid-template-columns:1fr 260px;gap:12px}.card{border:1px solid var(--l);border-radius:15px;background:#081328dd;overflow:hidden}.head{height:46px;border-bottom:1px solid var(--l);padding:0 12px;display:flex;align-items:center;justify-content:space-between;font-size:11px;letter-spacing:1px}
.canvas{height:calc(100vh - 235px);min-height:430px;position:relative;background-image:linear-gradient(#54e8ff08 1px,transparent 1px),linear-gradient(90deg,#54e8ff08 1px,transparent 1px);background-size:28px 28px;overflow:hidden}
.node{position:absolute;width:135px;padding:10px;border:1px solid #54e8ff66;border-radius:11px;background:#0b1b36;box-shadow:0 0 25px #54e8ff12;user-select:none}.node.lock{border-color:#5af0b0aa;box-shadow:0 0 25px #5af0b022}.node b{font-size:11px}.node small{display:block;color:var(--m);font-size:9px;margin-top:4px}.wire{position:absolute;height:2px;background:linear-gradient(90deg,var(--c),var(--b));transform-origin:left center;box-shadow:0 0 8px #54e8ff77}
.tools{display:flex;gap:6px;flex-wrap:wrap}.tool{border:1px solid var(--l);background:#ffffff04;color:#cceeff;border-radius:8px;padding:7px 9px;font-size:10px}.tool:hover{border-color:#54e8ff77}
.library{display:grid;grid-template-columns:1fr 1fr;gap:6px;max-height:360px;overflow:auto}.library button{padding:7px 4px;border:1px solid var(--l);background:#ffffff03;color:#dff5ff;border-radius:7px;font-size:9px}
.log{max-height:180px;overflow:auto;margin-top:9px}.msg{padding:7px;margin-bottom:5px;border:1px solid var(--l);border-radius:7px;color:#9fb7cd;font-size:10px}.msg.u{color:#b9c8ff}.msg.a{color:#aaf4d3}
.command{display:flex;gap:7px;margin-top:11px;padding:8px;border:1px solid #54e8ff44;border-radius:14px;background:#061022}.command input{flex:1;background:transparent;border:0;outline:0;color:white}.mic,.go{height:43px;border-radius:10px;border:1px solid #54e8ff66;background:#54e8ff0d;color:var(--c)}.mic{width:48px;border-radius:50%;font-size:18px}.mic.live{color:var(--g);border-color:var(--g);box-shadow:0 0 20px #5af0b033}.go{padding:0 15px}
.stat{display:flex;gap:7px;margin:10px 0}.stat div{border:1px solid var(--l);padding:8px 11px;border-radius:9px;color:var(--m);font-size:9px}.stat b{color:white;font-size:16px}
.info{color:var(--m);font-size:10px;line-height:1.5;border:1px solid var(--l);border-radius:10px;padding:10px;margin-top:10px}.camPanel{position:fixed;right:18px;bottom:18px;width:220px;border:1px solid var(--l);border-radius:14px;background:#040a17ee;padding:8px;z-index:20;box-shadow:0 0 30px #0008}.camPanel video{width:100%;height:125px;object-fit:cover;border-radius:9px;background:#02040a;display:none;transform:scaleX(-1)}.camRow{display:flex;gap:5px;margin-top:6px}.camBtn{flex:1;border:1px solid var(--l);background:#ffffff05;color:#cceeff;border-radius:8px;padding:7px;font-size:9px}.camBtn.live{border-color:var(--g);color:var(--g)}.gestureState{font-size:9px;color:var(--m);margin-top:6px}.gestureState b{color:var(--c)}
@media(max-width:1000px){.body{grid-template-columns:170px 1fr}.right{display:none}.workspace{grid-template-columns:1fr}}@media(max-width:650px){body{overflow:auto}.body{display:block}.left{display:flex;gap:5px;overflow:auto}.nav{min-width:115px}.canvas{height:520px}}
</style></head><body><div class="app">
<header class="top"><div class="logo"><div class="orb">D</div>DAVID_AI</div><div class="status"><span class="dot"></span> EXTERNAL SECURE AI BACKEND · <span id="st">READY</span></div></header>
<div class="body"><aside class="left">
<button class="nav on">◈ DESIGN STUDIO</button><button class="nav">◇ VISUAL ENGINE</button><button class="nav">▦ LIBRARY</button><button class="nav">▶ SIMULATION</button><button class="nav">✋ GESTURES</button><button class="nav">□ PROJECT</button>
<div class="info">Voice and gestures can control the conceptual model. Hand tracking uses the browser camera only when you explicitly activate it.</div>
</aside>
<main><div class="hero"><div><h1>Engineering Command Center</h1><p>Describe a machine, vehicle, circuit, fluid system, structure or spacecraft. The external AI can build a conceptual component graph from your command.</p></div><div class="badges"><span>CSE</span><span>EEE</span><span>ECE</span><span>FT</span><span>CIVIL</span><span>MECH</span><span>AUTO</span><span>SPACE</span></div></div>
<div class="stat"><div>PARTS <b id="n">0</b></div><div>LINKS <b id="w">0</b></div><div>STATE <b id="q">READY</b></div></div>
<div class="workspace"><section class="card"><div class="head"><b>VISUAL PROTOTYPE ENGINE</b><div class="tools"><button class="tool" onclick="splitSel()">SPLIT</button><button class="tool" onclick="rotateSel()">ROTATE</button><button class="tool" onclick="showAll()">SHOW ALL</button><button class="tool" onclick="check()">CHECK</button><button class="tool" onclick="run()">RUN</button><button class="tool" onclick="centerView()">CENTER</button><button class="tool" onclick="duplicateSel()">DUPLICATE</button></div></div><div id="canvas" class="canvas"></div></section>
<aside class="card" style="padding:10px"><b style="font-size:10px">UNIVERSAL COMPONENT LIBRARY</b><div id="lib" class="library" style="margin-top:9px"></div><b style="display:block;font-size:10px;margin-top:12px">ASSISTANT</b><div id="log" class="log"></div></aside></div>
<div class="command"><button id="mic" class="mic">◉</button><input id="cmd" placeholder="Say or type: design an automobile, then remove the engine, edit it, fix it, and show all parts"><button class="go" onclick="ask()">CREATE</button></div>
</main>
<aside class="right"><b style="font-size:10px">GESTURE GUIDE</b><div class="info">
<b>Pointing finger</b> select / move target<br><b>Pinch + drag</b> move selected part<br><b>Two hands apart</b> zoom in<br><b>Two hands together</b> zoom out<br><b>Victory</b> rotate selected part<br><b>Double-click</b> fix/unfix selected part<br><b>Open palm</b> show separated parts<br><b>Swipe</b> next component<br><b>Closed fist</b> split selected part<br><b>Thumb up</b> check design<br><b>Thumb down</b> run conceptual test<br><b>I-Love-You</b> reset / center view<br><br>
Camera tracking is explicitly enabled only after you press the camera button.
</div><b style="display:block;margin-top:15px;font-size:10px">SECURITY</b><div class="info">API key stays on Vercel. The browser receives only the AI result. Requests are size-limited and rate-limited. No database is used by this version.</div><div id="project" class="info">Project state exists in this browser session.</div></aside>
<div class="camPanel"><video id="cam" autoplay muted playsinline></video><div class="camRow"><button id="camOn" class="camBtn">ENABLE HANDS</button><button id="camOff" class="camBtn">OFF</button></div><div class="gestureState">HAND STATUS: <b id="handState">OFF</b></div></div>
</div></div>
<script>
const D=${JSON.stringify(departments)};
const S={nodes:[],links:[],sel:null,zoom:1,hidden:new Set()};
function esc(x){return String(x).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function add(name,type="Engineering",x,y){let id=name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),base=id,i=1;while(S.nodes.some(n=>n.id===id))id=base+'-'+(++i);let n={id,name,type,x:x??70+(S.nodes.length%4)*155,y:y??70+Math.floor(S.nodes.length/4)*100,r:0,locked:false,hidden:false};S.nodes.push(n);S.sel=id}
function render(){let c=document.getElementById('canvas');c.innerHTML='';let m=new Map(S.nodes.map(n=>[n.id,n]));for(let l of S.links){let a=m.get(l[0]),b=m.get(l[1]);if(!a||!b||a.hidden||b.hidden)continue;let e=document.createElement('div');e.className='wire';let x=a.x+67,y=a.y+30,X=b.x+67,Y=b.y+30,dx=X-x,dy=Y-y;e.style.left=x+'px';e.style.top=y+'px';e.style.width=Math.hypot(dx,dy)+'px';e.style.transform='rotate('+Math.atan2(dy,dx)+'rad)';c.appendChild(e)}for(let n of S.nodes){if(n.hidden)continue;let e=document.createElement('div');e.className='node'+(n.lock?' lock':'');e.style.left=n.x+'px';e.style.top=n.y+'px';e.style.transform='rotate('+n.r+'deg)';e.innerHTML='<b>'+esc(n.name)+'</b><small>'+esc(n.type)+(n.lock?' · FIXED':'')+'</small>';e.onclick=()=>{S.sel=n.id;document.getElementById('project').textContent='Selected: '+n.name};e.ondblclick=()=>{n.locked=!n.locked;n.lock=n.locked;render();};c.appendChild(e)}document.getElementById('n').textContent=S.nodes.length;document.getElementById('w').textContent=S.links.length}
function log(t,k='a'){let e=document.getElementById('log');e.innerHTML+='<div class="msg '+k+'">'+esc(t)+'</div>';e.scrollTop=e.scrollHeight}
function selected(){return S.nodes.find(x=>x.id===S.sel)}
function splitSel(){let n=selected();if(!n)return log('Select a component first.');n.hidden=true;add(n.name+' — separated part',n.type,n.x+35,n.y+75);render();log('Selected part separated.')}
function rotateSel(step=30){let n=selected();if(n&&!n.locked){n.r=(n.r+step)%360;render();log('Selected component rotated.')}else log(n?.locked?'Component is fixed.':'Select a component first.')}
function showAll(){S.nodes.forEach(n=>n.hidden=false);render();log('All separated components are visible.')}
function check(){document.getElementById('q').textContent='CHECKED';log('Conceptual design check complete. Physical verification still requires real testing.')}
function run(){document.getElementById('q').textContent='RUNNING';setTimeout(()=>{document.getElementById('q').textContent='COMPLETE';log('Conceptual simulation cycle completed.')},900)}
function centerView(){S.zoom=1;S.nodes.forEach((n,i)=>{n.x=70+(i%4)*170;n.y=70+Math.floor(i/4)*105});render();log('Model centered.')}
function duplicateSel(){let n=selected();if(!n)return log('Select a component first.');add(n.name+' copy',n.type,n.x+25,n.y+55);render();log('Component duplicated.')}
function connectNames(a,b){let A=S.nodes.find(n=>n.id===a||n.name.toLowerCase()===String(a).toLowerCase());let B=S.nodes.find(n=>n.id===b||n.name.toLowerCase()===String(b).toLowerCase());if(A&&B&&!S.links.some(l=>l[0]===A.id&&l[1]===B.id)){S.links.push([A.id,B.id]);render();log('Connected '+A.name+' → '+B.name)}}
function nearest(x,y){let best=null,bd=1e9;for(let n of S.nodes){if(n.hidden)continue;let d=Math.hypot((n.x+67)-x,(n.y+30)-y);if(d<bd){bd=d;best=n}}return best}
function canvasPoint(nx,ny){let c=document.getElementById('canvas').getBoundingClientRect();return {x:Math.max(0,Math.min(c.width||c.clientWidth,nx*c.clientWidth)),y:Math.max(0,Math.min(c.height||c.clientHeight,ny*c.clientHeight))}}
async function ask(){let p=document.getElementById('cmd'),v=p.value.trim();if(!v)return;log(v,'u');p.value='';document.getElementById('st').textContent='PROCESSING';try{let r=await fetch('/api',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({prompt:v,state:{nodes:S.nodes,links:S.links}})});let d=await r.json();if(!r.ok)throw Error(d.error||'Backend error');log(d.reply||'Command completed.');for(let a of d.actions||[]){if(a.type==='add')add(a.name,a.target,a.x,a.y);if(a.type==='remove'){let z=S.nodes.find(n=>n.id===a.target||n.name.toLowerCase()===String(a.target||'').toLowerCase());if(z)z.hidden=true}if(a.type==='split')splitSel();if(a.type==='fix'){let z=S.nodes.find(n=>n.id===a.target||n.name.toLowerCase()===String(a.target||'').toLowerCase());if(z)z.locked=true;render()}if(a.type==='rotate')rotateSel(Number(a.angle)||30);if(a.type==='showall')showAll();if(a.type==='check')check();if(a.type==='run')run();if(a.type==='center'||a.type==='reset')centerView();if(a.type==='duplicate')duplicateSel();if(a.type==='connect')connectNames(a.source,a.target);if(a.type==='move'){let z=S.nodes.find(n=>n.id===a.target||n.name.toLowerCase()===String(a.target||'').toLowerCase());if(z&&!z.locked){z.x=Number(a.x)||z.x;z.y=Number(a.y)||z.y;render()}}}render();document.getElementById('st').textContent='READY'}catch(e){log(e.message);document.getElementById('st').textContent='BACKEND ERROR'}}
let rec;document.getElementById('mic').onclick=()=>{if(!('SpeechRecognition'in window||'webkitSpeechRecognition'in window)){log('Speech recognition is unavailable in this browser.');return}let R=window.SpeechRecognition||window.webkitSpeechRecognition;rec=new R();rec.lang='en-IN';rec.continuous=false;rec.interimResults=false;rec.onstart=()=>{document.getElementById('mic').classList.add('live');document.getElementById('st').textContent='LISTENING'};rec.onresult=e=>{document.getElementById('cmd').value=e.results[0][0].transcript;ask()};rec.onend=()=>{document.getElementById('mic').classList.remove('live');document.getElementById('st').textContent='READY'};rec.onerror=()=>{document.getElementById('mic').classList.remove('live');document.getElementById('st').textContent='READY'};rec.start()};
let handRecognizer=null,camStream=null,tracking=false,lastGesture='',lastGestureAt=0,lastPoint=null,pinchNode=null,lastTwoDist=null,lastTwoAngle=null;
function gestureAction(name){const now=Date.now();if(name===lastGesture&&now-lastGestureAt<900)return;lastGesture=name;lastGestureAt=now;if(name==='Pointing_Up'){document.getElementById('handState').textContent='POINT — SELECT';}if(name==='Closed_Fist'){splitSel()}if(name==='Open_Palm'){showAll()}if(name==='Victory'){rotateSel()}if(name==='Thumb_Up'){check()}if(name==='Thumb_Down'){run()}if(name==='ILoveYou'){centerView()}if(name==='Thumb_Up'||name==='Thumb_Down'||name==='Victory'||name==='Closed_Fist'||name==='Open_Palm'||name==='ILoveYou')document.getElementById('project').textContent='Gesture: '+name}
function lmDist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function processHands(result){if(!result||!result.landmarks||!result.landmarks.length){document.getElementById('handState').textContent='NO HAND';lastTwoDist=null;return}document.getElementById('handState').textContent=result.landmarks.length+' HAND'+(result.landmarks.length>1?'S':'');let hands=result.landmarks;if(hands.length===1){let h=hands[0],idx=h[8],thumb=h[4],d=lmDist(idx,thumb);if(d<0.055){let c=document.getElementById('canvas'),x=idx.x*c.clientWidth,y=idx.y*c.clientHeight;if(!pinchNode)pinchNode=selected()||nearest(x,y);if(pinchNode&&!pinchNode.locked){pinchNode.x=Math.max(0,Math.min(c.clientWidth-145,x-67));pinchNode.y=Math.max(0,Math.min(c.clientHeight-70,y-30));S.sel=pinchNode.id;render();document.getElementById('handState').textContent='PINCH — MOVE'}}else{pinchNode=null}let g=result.gestures?.[0]?.[0]?.categoryName;if(g)gestureAction(g)}else{pinchNode=null;let a=hands[0][8],b=hands[1][8],dist=lmDist(a,b);if(lastTwoDist!==null){let delta=dist-lastTwoDist;if(Math.abs(delta)>0.018){S.zoom=Math.max(.55,Math.min(2.2,S.zoom+(delta>0?.08:-.08)));document.getElementById('canvas').style.transform='scale('+S.zoom+')';document.getElementById('canvas').style.transformOrigin='center center';document.getElementById('handState').textContent=delta>0?'TWO HANDS — ZOOM IN':'TWO HANDS — ZOOM OUT'}}lastTwoDist=dist;let angle=Math.atan2(b.y-a.y,b.x-a.x);if(lastTwoAngle!==null){let da=angle-lastTwoAngle;if(Math.abs(da)>.16){rotateSel(da>0?15:-15);document.getElementById('handState').textContent='TWO HANDS — ROTATE'}}lastTwoAngle=angle}}
async function startHands(){if(tracking)return;try{document.getElementById('handState').textContent='LOADING MODEL';const mod=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/+esm');const {FilesetResolver,GestureRecognizer}=mod;const vision=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm');handRecognizer=await GestureRecognizer.createFromOptions(vision,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',delegate:'GPU'},runningMode:'VIDEO',numHands:2});camStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480}},audio:false});let v=document.getElementById('cam');v.srcObject=camStream;v.style.display='block';tracking=true;document.getElementById('camOn').classList.add('live');document.getElementById('handState').textContent='READY';log('Hand tracking enabled. Camera stays local to this browser session.');requestAnimationFrame(trackFrame)}catch(e){tracking=false;document.getElementById('handState').textContent='UNAVAILABLE';log('Camera/gesture model could not start: '+e.message)}}
function stopHands(){tracking=false;if(camStream)camStream.getTracks().forEach(t=>t.stop());camStream=null;let v=document.getElementById('cam');v.srcObject=null;v.style.display='none';document.getElementById('camOn').classList.remove('live');document.getElementById('handState').textContent='OFF';lastTwoDist=null;lastTwoAngle=null;pinchNode=null;log('Hand tracking disabled.');}
function trackFrame(){if(!tracking||!handRecognizer)return;let v=document.getElementById('cam');if(v.readyState>=2){try{let r=handRecognizer.recognizeForVideo(v,performance.now());processHands(r)}catch(e){}}requestAnimationFrame(trackFrame)}
document.getElementById('camOn').onclick=startHands;document.getElementById('camOff').onclick=stopHands;window.addEventListener('beforeunload',stopHands);

const cv=document.getElementById('canvas');let dragId=null,dragOffX=0,dragOffY=0;cv.addEventListener('pointerdown',e=>{let n=nearest(e.offsetX,e.offsetY);if(n){S.sel=n.id;if(!n.locked){dragId=n.id;dragOffX=e.offsetX-n.x;dragOffY=e.offsetY-n.y}render()}});cv.addEventListener('pointermove',e=>{if(!dragId)return;let n=S.nodes.find(x=>x.id===dragId);if(n&&!n.locked){n.x=e.offsetX-dragOffX;n.y=e.offsetY-dragOffY;render()}});cv.addEventListener('pointerup',()=>dragId=null);cv.addEventListener('pointercancel',()=>dragId=null);cv.addEventListener('dblclick',e=>{let n=nearest(e.offsetX,e.offsetY);if(n){n.locked=!n.locked;n.lock=n.locked;S.sel=n.id;render();log(n.locked?'Component fixed.':'Component released.')}});
document.getElementById('cmd').onkeydown=e=>{if(e.key==='Enter')ask()};
let all=[];for(let [d,a] of Object.entries(D))for(let x of a)all.push([x,d]);document.getElementById('lib').innerHTML=all.map(x=>'<button>'+esc(x[0])+'<br><small style="color:#7892ae">'+esc(x[1])+'</small></button>').join('');document.querySelectorAll('#lib button').forEach((b,i)=>b.onclick=()=>{add(all[i][0],all[i][1]);render();log('Imported '+all[i][0])});
add('Vehicle Chassis','AUTOMOBILE',100,190);add('Engine','AUTOMOBILE',330,120);add('Transmission','AUTOMOBILE',330,280);add('Wheel / Suspension','AUTOMOBILE',570,110);add('Wheel / Suspension','AUTOMOBILE',570,320);S.links=[['vehicle-chassis','engine'],['engine','transmission'],['transmission','wheel-suspension'],['transmission','wheel-suspension-2']];S.sel='engine';render();log('Example automobile prototype loaded.');log('Double-click Engine to fix/unfix it.'); 
</script></body></html>`;

module.exports = async (req,res)=>{
  res.setHeader("Content-Security-Policy","default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://cdn.jsdelivr.net https://storage.googleapis.com; worker-src 'self' blob:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
  res.setHeader("X-Content-Type-Options","nosniff");res.setHeader("X-Frame-Options","DENY");res.setHeader("Referrer-Policy","no-referrer");res.setHeader("Permissions-Policy","camera=(self), microphone=(self), geolocation=(), usb=()");
  if(req.method==="GET"){res.statusCode=200;res.setHeader("Content-Type","text/html; charset=utf-8");res.setHeader("Cache-Control","no-store");res.end(page);return}
  if(req.method!=="POST"){send(res,405,{error:"Method not allowed"});return}
  const ip=(req.headers["x-forwarded-for"]||req.socket?.remoteAddress||"unknown").split(",")[0];
  if(!rateOk(ip)){send(res,429,{error:"Too many requests. Please wait."});return}
  let body=req.body;if(!body){let chunks=[],size=0;for await(const ch of req){size+=ch.length;if(size>MAX){send(res,413,{error:"Request too large"});return}chunks.push(ch)}try{body=JSON.parse(Buffer.concat(chunks).toString())}catch{send(res,400,{error:"Invalid JSON"});return}}
  const prompt=clean(body.prompt,8000);if(!prompt){send(res,400,{error:"Empty command"});return}
  if(!process.env.OPENAI_API_KEY){send(res,503,{error:"Vercel backend is deployed, but OPENAI_API_KEY is not configured as a Vercel server-side secret."});return}
  const state=JSON.stringify(body.state||{}).slice(0,12000);
  try{
    const upstream=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:"Bearer "+process.env.OPENAI_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({model:MODEL,input:[{role:"developer",content:SYSTEM},{role:"user",content:"CURRENT STATE:\\n"+state+"\\n\\nCOMMAND:\\n"+prompt}],store:false,max_output_tokens:2200})});
    if(!upstream.ok){console.error("provider",upstream.status);send(res,502,{error:"External AI service error."});return}
    const data=await upstream.json();let out=data.output_text||"";if(!out&&Array.isArray(data.output))for(const x of data.output)for(const c of x.content||[])if(c.text)out+=c.text;
    const parsed=extract(out);if(!parsed){send(res,200,{reply:out||"No structured result returned.",actions:[]});return}
    parsed.reply=clean(parsed.reply||"Command completed.",4000);parsed.actions=Array.isArray(parsed.actions)?parsed.actions.slice(0,60):[];send(res,200,parsed)
  }catch(e){console.error(e);send(res,500,{error:"Secure backend request failed."})}
};

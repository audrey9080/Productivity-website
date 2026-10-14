
const $=id=>document.getElementById(id), c=$('avatar'), ctx=c.getContext('2d');
const neutral={x:0,y:0,roll:0,yaw:0,pitch:0,mouth:0,left:1,right:1,smile:0,brow:0};
let target={...neutral}, pose={...neutral}, center={x:.5,y:.5,yaw:0,pitch:0,roll:0}, latest=null, tracker=null, media=null, audioMedia=null,audioCtx=null,analyser=null,audioData=null, running=false, demo=false,lastVideo=-1,lastDetect=0,lastFace=0,starting=false;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function status(s){$('status').textContent=s}
function shape(fill,stroke,fn,width=5){ctx.beginPath();fn();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.lineJoin='round';ctx.stroke()}}
function ellipse(x,y,rx,ry,fill,stroke=null,width=5){shape(fill,stroke,()=>ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2),width)}
function line(color,width,fn){ctx.beginPath();fn();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke()}
function draw(t){
 ctx.clearRect(0,0,800,900);const outline='#545372',skin='#a6d7eb';const idle=Math.sin(t/1600)*3;
 ctx.save();ctx.translate(pose.x*.45,pose.y*.3+idle);ctx.translate(400,665);ctx.rotate(pose.roll*.16);ctx.translate(-400,-665);
 // Soft, rounded command uniform.
 shape('#303043',outline,()=>{ctx.moveTo(180,880);ctx.lineTo(196,645);ctx.quadraticCurveTo(201,571,310,552);ctx.lineTo(490,552);ctx.quadraticCurveTo(599,571,604,645);ctx.lineTo(620,880);ctx.closePath()});
 shape('#bb647d',outline,()=>{ctx.moveTo(200,635);ctx.quadraticCurveTo(224,568,320,553);ctx.lineTo(480,553);ctx.quadraticCurveTo(576,568,600,635);ctx.lineTo(574,728);ctx.quadraticCurveTo(400,695,226,728);ctx.closePath()});
 line('#e8a1b1',5,()=>{ctx.moveTo(232,627);ctx.quadraticCurveTo(265,590,306,584)});
 line('#494455',4,()=>{ctx.moveTo(258,745);ctx.lineTo(245,870);ctx.moveTo(542,745);ctx.lineTo(555,870)});
 shape(skin,outline,()=>{ctx.moveTo(342,491);ctx.lineTo(340,553);ctx.quadraticCurveTo(400,600,460,553);ctx.lineTo(458,491);ctx.closePath()});
 shape('#262636',outline,()=>{ctx.moveTo(326,543);ctx.quadraticCurveTo(400,590,474,543);ctx.lineTo(484,581);ctx.quadraticCurveTo(400,625,316,581);ctx.closePath()});
 for(let i=0;i<4;i++)ellipse(427+i*13,580-i*2,5,5,'#f4d697','#b39262',2);
 // Communicator, with a quiet gold glint.
 ellipse(510,666,23,16,'#aaa9ba',outline,3);
 shape('#f2d698','#84735b',()=>{ctx.moveTo(510,633);ctx.lineTo(494,679);ctx.lineTo(508,666);ctx.lineTo(526,680);ctx.closePath()},3);
 line('#716579',2,()=>{ctx.moveTo(510,650);ctx.lineTo(509,662)});
 // Head rotates separately from the shoulders.
 ctx.translate(400,490);ctx.rotate(pose.roll);ctx.translate(-400,-490);ctx.translate(pose.yaw*15,pose.pitch*8);
 ellipse(247,353,28,43,skin,outline);ellipse(553,353,28,43,skin,outline);
 line('#80abc7',4,()=>{ctx.moveTo(240,333);ctx.quadraticCurveTo(268,350,242,376);ctx.moveTo(560,333);ctx.quadraticCurveTo(532,350,558,376)});
 const grad=ctx.createLinearGradient(270,200,540,470);grad.addColorStop(0,'#c1e6f2');grad.addColorStop(.65,skin);grad.addColorStop(1,'#8bbbd9');
 shape(grad,outline,()=>{ctx.moveTo(249,329);ctx.bezierCurveTo(243,196,310,156,400,156);ctx.bezierCurveTo(490,156,557,196,551,329);ctx.bezierCurveTo(553,449,491,527,400,538);ctx.bezierCurveTo(309,527,247,449,249,329);ctx.closePath()},6);
 // Bolian facial ridge, from crown to chin.
 line('#78a4c6',7,()=>{ctx.moveTo(401,162);ctx.bezierCurveTo(389,248,409,289,398,342);ctx.quadraticCurveTo(391,378,402,398);ctx.lineTo(400,526)});
 line('#d8f0f7',3,()=>{ctx.moveTo(407,169);ctx.bezierCurveTo(398,251,416,291,405,342);ctx.quadraticCurveTo(398,375,408,394);ctx.lineTo(406,516)});
 ctx.save();ctx.globalAlpha=.35;ellipse(297,407,29,14,'#dda6d7');ellipse(503,407,29,14,'#dda6d7');ctx.restore();
 for(const x of [280,296,312,488,504,520])ellipse(x,392+(x%3)*4,2.5,2.5,'#86b2cf');
 const facialShift=pose.yaw*14;
 function eye(x,openness){ctx.save();ctx.translate(x+facialShift,351);ctx.scale(1,Math.max(.06,openness));ellipse(0,0,39,35,'#f2effb',outline,4);ellipse(pose.yaw*5,-1+pose.pitch*3,22,29,'#a598dc','#777096',3);ellipse(pose.yaw*5,-1+pose.pitch*3,11,22,'#49465f');ellipse(-7+pose.yaw*5,-11,7,8,'#fff');ellipse(9+pose.yaw*5,10,3,4,'#d9d5ff');line('#52506c',5,()=>{ctx.moveTo(-39,-4);ctx.quadraticCurveTo(0,-44,39,-4)});ctx.restore();line('#52506c',4,()=>{ctx.moveTo(x-39+facialShift,347);ctx.lineTo(x-45+facialShift,340)})}
 eye(323,pose.left);eye(477,pose.right);
 line('#7783a4',5,()=>{ctx.moveTo(290+facialShift,300-pose.brow*15);ctx.quadraticCurveTo(320+facialShift,289-pose.brow*18,350+facialShift,302-pose.brow*15);ctx.moveTo(450+facialShift,302-pose.brow*15);ctx.quadraticCurveTo(480+facialShift,289-pose.brow*18,510+facialShift,300-pose.brow*15)});
 line('#729bb8',3,()=>{ctx.moveTo(389+facialShift,396);ctx.quadraticCurveTo(400+facialShift,402,413+facialShift,396)});
 const mx=400+facialShift,my=453,open=pose.mouth;
 if(open>.07){ellipse(mx,my,19+pose.smile*12,3+open*24,'#655067','#71617e',3);ctx.save();ctx.beginPath();ctx.ellipse(mx,my,19+pose.smile*12,3+open*24,0,0,Math.PI*2);ctx.clip();ellipse(mx,my+14,15,9,'#d391b0');if(open>.25){ctx.fillStyle='#fff1ee';ctx.fillRect(mx-24,my-26,48,12)}ctx.restore()}
 else line('#756179',4,()=>{ctx.moveTo(mx-19-pose.smile*9,my-2);ctx.quadraticCurveTo(mx,my+9+pose.smile*5,mx+19+pose.smile*9,my-2)});
 line('#cbe7f1',4,()=>{ctx.moveTo(290,236);ctx.quadraticCurveTo(309,205,340,201)});
 ctx.restore();
}
function consume(r){const p=r.faceLandmarks?.[0];if(!p){return}lastFace=performance.now();const b=Object.fromEntries((r.faceBlendshapes?.[0]?.categories??[]).map(x=>[x.categoryName,x.score]));const l=p[33],rt=p[263],n=p[1],width=Math.hypot(rt.x-l.x,rt.y-l.y);if(width<.01)return;
 latest={x:(l.x+rt.x)/2,y:(l.y+rt.y)/2,roll:Math.atan2(rt.y-l.y,rt.x-l.x),yaw:(n.x-(l.x+rt.x)/2)/width,pitch:(n.y-(l.y+rt.y)/2)/width};const sign=$('mirror').checked?-1:1,g=+$('gain').value;
 target.x=clamp((latest.x-center.x)*400*sign*g,-65,65);target.y=clamp((latest.y-center.y)*280*g,-40,40);target.roll=clamp((latest.roll-center.roll)*sign*g,-.35,.35);target.yaw=clamp((latest.yaw-center.yaw)*4*sign*g,-1,1);target.pitch=clamp((latest.pitch-center.pitch)*3*g,-1,1);target.mouth=clamp((b.jawOpen??0)*2,0,1);target.left=clamp(1-(b.eyeBlinkRight??0)*1.5,.02,1);target.right=clamp(1-(b.eyeBlinkLeft??0)*1.5,.02,1);target.smile=((b.mouthSmileLeft??0)+(b.mouthSmileRight??0))/2;target.brow=b.browInnerUp??0;
}
async function devices(){try{const list=await navigator.mediaDevices.enumerateDevices();const old=$('camera').value;$('camera').replaceChildren(new Option('Default camera',''));list.filter(d=>d.kind==='videoinput').forEach((d,i)=>$('camera').add(new Option(d.label||`Camera ${i+1}`,d.deviceId)));$('camera').value=old}catch{}}
async function start(){if(starting||running)return;starting=true;$('start').disabled=true;demo=false;try{status('Loading face tracking…');if(!tracker){const {FaceLandmarker,FilesetResolver}=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/vision_bundle.mjs');const files=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm');tracker=await FaceLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'},runningMode:'VIDEO',numFaces:1,outputFaceBlendshapes:true})}
 status('Allow camera access in your browser.');media=await navigator.mediaDevices.getUserMedia({video:{width:{ideal:640},height:{ideal:480},frameRate:{ideal:24,max:30},...($('camera').value?{deviceId:{exact:$('camera').value}}:{})},audio:false});$('video').srcObject=media;await $('video').play();running=true;lastVideo=-1;lastFace=0;latest=null;status('Tracking started. Look straight ahead, then click “Center my pose”.');$('stop').hidden=false;$('start').hidden=true;await devices();}catch(e){stop();status(`Could not start: ${e.message}. Use Chrome or Edge, check camera permissions, and close other apps using this camera.`)}finally{starting=false;$('start').disabled=false}}
function stop(){running=false;media?.getTracks().forEach(t=>t.stop());media=null;$('video').srcObject=null;audioMedia?.getTracks().forEach(t=>t.stop());audioMedia=null;audioCtx?.close();audioCtx=null;analyser=null;target={...neutral};$('start').hidden=false;$('stop').hidden=true;$('mic').textContent='Use microphone for mouth';status('Camera and microphone stopped. Preview mode.');}
async function mic(){if(analyser){audioMedia.getTracks().forEach(t=>t.stop());audioCtx.close();analyser=null;audioMedia=null;audioCtx=null;$('mic').textContent='Use microphone for mouth';return}try{audioMedia=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});audioCtx=new AudioContext();await audioCtx.resume();analyser=audioCtx.createAnalyser();analyser.fftSize=512;audioCtx.createMediaStreamSource(audioMedia).connect(analyser);audioData=new Uint8Array(analyser.fftSize);$('mic').textContent='Stop microphone mouth';$('stop').hidden=false;status('Microphone mouth enabled. Webcam still controls pose and eyes.')}catch(e){status('Microphone unavailable: '+e.message)}}
function frame(t){if(running&&t-lastDetect>45&&$('video').readyState>=2&&$('video').currentTime!==lastVideo){lastVideo=$('video').currentTime;lastDetect=t;try{consume(tracker.detectForVideo($('video'),t))}catch(e){stop();status('Tracking stopped: '+e.message)}}
 if(running&&t-lastFace>1200){target={...neutral};if(t-lastFace>2500)status('No face detected. Face the camera and improve the lighting.')}else if(running&&$('status').textContent.startsWith('No face'))status('Face found. Tracking Sav.');
 if(!running){target={...neutral};const blink=t%4800;target.left=target.right=blink>4550?Math.abs(blink-4675)/125:1;if(demo){target.roll=Math.sin(t/1600)*.10;target.yaw=Math.sin(t/1900)*.6;target.mouth=Math.max(0,Math.sin(t/110))*.75;target.smile=.3}}
 if(analyser){analyser.getByteTimeDomainData(audioData);let sum=0;for(const a of audioData)sum+=((a-128)/128)**2;target.mouth=clamp((Math.sqrt(sum/audioData.length)-.012)*9,0,1)}
 for(const k of Object.keys(pose))pose[k]+=(target[k]-pose[k])*(+$('smooth').value);draw(t);requestAnimationFrame(frame)}
 $('start').onclick=start;$('stop').onclick=stop;$('mic').onclick=mic;$('calibrate').onclick=()=>{if(latest){center={...latest};status('Centered. You’re ready to stream.')}else status('Start tracking and face the camera before centering.')};$('demo').onclick=()=>{if(running)stop();demo=!demo;$('demo').textContent=demo?'Stop talking demo':'Play talking demo'};$('stream').onclick=()=>{document.body.classList.add('stream');document.body.classList.toggle('transparent',$('background').value==='transparent')};document.addEventListener('keydown',e=>{if(e.key==='Escape')document.body.classList.remove('stream')});$('gain').oninput=()=>{$('gainValue').textContent=(+$('gain').value).toFixed(1)+'×'};window.addEventListener('beforeunload',stop);devices();requestAnimationFrame(frame);


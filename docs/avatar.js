
const $=id=>document.getElementById(id), c=$('avatar'), ctx=c.getContext('2d');
const neutral={x:0,y:0,roll:0,yaw:0,pitch:0,mouth:0,left:1,right:1,smile:0,brow:0};
let target={...neutral}, pose={...neutral}, center={x:.5,y:.5,yaw:0,pitch:0,roll:0}, latest=null, tracker=null, media=null, audioMedia=null,audioCtx=null,analyser=null,audioData=null, running=false, demo=false,lastVideo=-1,lastDetect=0,lastFace=0,starting=false;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function status(s){$('status').textContent=s}
const sprite=new Image();let spriteFrames=null;const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const avatarChoice=$('avatar-style');
let fullBody=new URL(location.href).searchParams.get('avatar')==='full-body';
function loadAvatar(){
 fullBody=avatarChoice.value==='full-body';spriteFrames=null;
 sprite.src=fullBody?'assets/sav-full-body-hip-pose-v6.png':'assets/sav-pixel-sprites.png';
 c.setAttribute('aria-label',fullBody?'Animated full-body pixel Sav, a blue alien captain':'Animated portrait of Sav, a pastel-blue Bolian captain');
 const url=new URL(location.href);url.searchParams.set('avatar',avatarChoice.value);history.replaceState(null,'',url);
}
avatarChoice.value=fullBody?'full-body':'portrait';avatarChoice.addEventListener('change',loadAvatar);
sprite.onload=()=>{
 const temp=document.createElement('canvas');temp.width=sprite.width;temp.height=sprite.height;const tc=temp.getContext('2d',{willReadFrequently:true});tc.drawImage(sprite,0,0);const pixels=tc.getImageData(0,0,sprite.width,sprite.height).data;
 const w=sprite.width/2,h=sprite.height/2;spriteFrames=[];
 for(let row=0;row<2;row++)for(let col=0;col<2;col++){
  const sx=Math.floor(col*w),sy=Math.floor(row*h),ex=Math.floor((col+1)*w),ey=Math.floor((row+1)*h);let x0=ex,y0=ey,x1=sx,y1=sy;
  for(let y=sy;y<ey;y++)for(let x=sx;x<ex;x++)if(pixels[(y*sprite.width+x)*4+3]>48){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)}
  spriteFrames.push({x:x0,y:y0,w:x1-x0+1,h:y1-y0+1});
 }
 if(fullBody){
  const local=spriteFrames.map((frame,i)=>({x:frame.x-(i%2)*w,y:frame.y-Math.floor(i/2)*h,w:frame.w,h:frame.h}));
  const left=Math.min(...local.map(f=>f.x)),top=Math.min(...local.map(f=>f.y));
  const right=Math.max(...local.map(f=>f.x+f.w)),bottom=Math.max(...local.map(f=>f.y+f.h));
  spriteFrames=local.map((_,i)=>({x:(i%2)*w+left,y:Math.floor(i/2)*h+top,w:right-left,h:bottom-top}));
 }
};sprite.onerror=()=>status('Sav artwork could not load. Refresh this page or check your connection.');loadAvatar();
let talking=false,blinking=false;
function draw(t){
 ctx.clearRect(0,0,800,900);if(!spriteFrames)return;
 // Hysteresis prevents frame chatter around speech/blink thresholds.
 talking=pose.mouth>(talking?.10:.18);blinking=Math.min(pose.left,pose.right)<(blinking?.65:.40);
 const index=(blinking?2:0)+(talking?1:0);
 const frame=spriteFrames[fullBody?[0,2,1,3][index]:index];
 const breathe=reducedMotion?0:Math.sin(t/1800)*1.5;
 const speechBounce=reducedMotion||!talking?0:Math.sin(t/220)*.6;
 const height=760,width=fullBody?Math.round(height*frame.w/frame.h):620;
 ctx.save();ctx.imageSmoothingEnabled=false;
 if(fullBody){
  // A continuous strip deformation keeps boots planted while hips lead the sway.
  // This is procedural sprite motion, not a tracked skeletal/body rig.
  const sway=reducedMotion?0:Math.sin(t/2100)*7;
  for(let y=0;y<height;y+=2){
   const fromFeet=Math.max(0,(1-y/(height-2)-.08)/.92);
   const hipWeight=Math.sin(Math.min(1,fromFeet/.62)*Math.PI/2);
   const upper=Math.max(0,(fromFeet-.55)/.45);
   const dx=hipWeight*(sway+pose.x*.16)+upper*(pose.roll*26+pose.yaw*3);
   const dy=upper*(pose.y*.12+breathe+speechBounce);
   const sourceHeight=Math.min(2,height-y)*frame.h/height;
   ctx.drawImage(sprite,frame.x,frame.y+y*frame.h/height,frame.w,sourceHeight,400-width/2+dx,825-height+y+dy,width,Math.min(2,height-y)+.4);
  }
 }else{
  ctx.translate(400+pose.x,825+pose.y+breathe+speechBounce);ctx.rotate(pose.roll*.45);ctx.scale(1-Math.abs(pose.yaw)*.05,1);ctx.drawImage(sprite,frame.x,frame.y,frame.w,frame.h,-width/2,-height,width,height);
 }
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
let previousFrame=0;
function frame(t){const dt=Math.min(80,previousFrame?t-previousFrame:16.67);previousFrame=t;if(running&&t-lastDetect>45&&$('video').readyState>=2&&$('video').currentTime!==lastVideo){lastVideo=$('video').currentTime;lastDetect=t;try{consume(tracker.detectForVideo($('video'),t))}catch(e){stop();status('Tracking stopped: '+e.message)}}
 if(running&&t-lastFace>1200){target={...neutral};if(t-lastFace>2500)status('No face detected. Face the camera and improve the lighting.')}else if(running&&$('status').textContent.startsWith('No face'))status('Face found. Tracking Sav.');
 if(!running){target={...neutral};const blink=t%4800;target.left=target.right=blink>4550?Math.abs(blink-4675)/125:1;if(demo){target.roll=Math.sin(t/1600)*.10;target.yaw=Math.sin(t/1900)*.6;target.mouth=Math.max(0,Math.sin(t/110))*.75;target.smile=.3}}
 if(analyser){analyser.getByteTimeDomainData(audioData);let sum=0;for(const a of audioData)sum+=((a-128)/128)**2;target.mouth=clamp((Math.sqrt(sum/audioData.length)-.012)*9,0,1)}
 for(const k of Object.keys(pose)){const response=['mouth','left','right'].includes(k)?Math.max(.32,+$('smooth').value):+$('smooth').value;const alpha=1-Math.pow(1-response,dt/16.67);pose[k]+=(target[k]-pose[k])*alpha;}draw(t);requestAnimationFrame(frame)}
 $('start').onclick=start;$('stop').onclick=stop;$('mic').onclick=mic;$('calibrate').onclick=()=>{if(latest){center={...latest};status('Centered. You’re ready to stream.')}else status('Start tracking and face the camera before centering.')};$('demo').onclick=()=>{if(running)stop();demo=!demo;$('demo').textContent=demo?'Stop talking demo':'Play talking demo'};$('stream').onclick=()=>{document.body.classList.add('stream');document.body.classList.toggle('transparent',$('background').value==='transparent')};document.addEventListener('keydown',e=>{if(e.key==='Escape')document.body.classList.remove('stream')});$('gain').oninput=()=>{$('gainValue').textContent=(+$('gain').value).toFixed(1)+'×'};window.addEventListener('beforeunload',stop);devices();requestAnimationFrame(frame);


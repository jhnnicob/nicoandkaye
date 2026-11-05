const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
const source=fs.readFileSync('js/music.js','utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function setup({preference=null,blocked=false,missing=false,deferred=false,storageFails=false,withOpener=true,protectedRect=null}={}){
 class Target{
  constructor(){this.events=new Map();this.attrs={};this.hidden=false;this.dataset={};this.styles={};this.style={setProperty:(key,value)=>{this.styles[key]=value;}};}
  addEventListener(name,fn){if(!this.events.has(name))this.events.set(name,new Set());this.events.get(name).add(fn);}
  removeEventListener(name,fn){this.events.get(name)?.delete(fn);}
  emit(name,event={}){for(const fn of [...(this.events.get(name)||[])])fn(event);}
  setAttribute(name,value){this.attrs[name]=value;}
  getBoundingClientRect(){const lift=parseFloat(this.styles['--music-lift']||'0');return {left:140,right:344,top:738-lift,bottom:784-lift,width:204,height:46};}
 }
 const audio=new Target();audio.paused=true;audio.playCalls=0;audio.pauseCalls=0;audio.loadCalls=0;
 let resolvePlay,rejectPlay;
 audio.play=()=>{audio.playCalls++;if(blocked)return Promise.reject(Object.assign(Error('User gesture required'),{name:'NotAllowedError'}));if(missing)return Promise.reject(Object.assign(Error('Missing audio'),{name:'NotSupportedError'}));audio.paused=false;if(deferred)return new Promise((resolve,reject)=>{resolvePlay=resolve;rejectPlay=reject;});audio.emit('playing');return Promise.resolve();};
 audio.pause=()=>{audio.pauseCalls++;audio.paused=true;audio.emit('pause');};audio.load=()=>{audio.loadCalls++;audio.error=null;audio.paused=true;};
 const parts=new Map(['button','[data-music-note]','[data-music-pause]','.music-player__hint','.music-player__status'].map(key=>[key,new Target()]));
 const player=new Target();player.querySelector=selector=>parts.get(selector);
 const opener=new Target(),dialog=new Target();dialog.open=false;
 const protectedControl=new Target();protectedControl.getBoundingClientRect=()=>protectedRect||{left:0,right:0,top:0,bottom:0,width:0,height:0};
 const body={children:[],appendChild:node=>body.children.push(node)};const frames=new Map();let frameId=0;const observers=[];
 const values=new Map(preference?[['nico-kaye-music',preference]]:[]);
 const window=new Target();window.innerHeight=800;window.localStorage={getItem:key=>{if(storageFails)throw Error('Blocked');return values.get(key)||null;},setItem:(key,value)=>{if(storageFails)throw Error('Blocked');values.set(key,value);}};window.requestAnimationFrame=fn=>{const id=++frameId;frames.set(id,fn);return id;};window.cancelAnimationFrame=id=>frames.delete(id);window.visualViewport=new Target();
 class Observer{constructor(callback){this.callback=callback;this.disconnected=false;observers.push(this);}observe(){}disconnect(){this.disconnected=true;}}
 const document={body,getElementById:id=>id==='wedding-music'?audio:id==='invitation-open'&&withOpener?opener:null,createElement:()=>player,querySelectorAll:selector=>selector==='dialog'?[dialog]:[protectedControl]};
 const context={window,document,MutationObserver:Observer};vm.runInNewContext(source,context);
 const flush=()=>{for(const [id,fn]of [...frames]){frames.delete(id);fn();}};
 return {audio,player,parts,opener,dialog,window,values,body,observers,flush,reinitialize:()=>vm.runInNewContext(source,context),allow:()=>{blocked=false;missing=false;},fail:()=>{audio.error={code:4};missing=true;audio.emit('error');},resolve:()=>resolvePlay(),reject:()=>rejectPlay(Error('Aborted'))};
}
test('autoplay allowed: one looping audio at 25 percent; duplicate script initialization is ignored',async()=>{
 const app=setup();await tick();assert.equal(app.audio.playCalls,1);assert.equal(app.audio.loop,true);assert.equal(app.audio.preload,'metadata');assert.equal(app.audio.volume,.25);assert.equal(app.parts.get('button').attrs['aria-label'],'Pause background music');app.reinitialize();assert.equal(app.body.children.length,1);assert.equal(app.audio.playCalls,1);
});
test('blocked autoplay offers a control and a real invitation-opening click retries without changing that interaction',async()=>{
 const app=setup({blocked:true});await tick();assert.equal(app.parts.get('.music-player__hint').hidden,false);assert.equal(app.parts.get('.music-player__hint').textContent,'Tap to Play Music');
 app.allow();app.opener.emit('click');await tick();assert.equal(app.audio.playCalls,2);assert.equal(app.audio.paused,false);assert.equal(app.parts.get('.music-player__hint').hidden,true);
});
test('manual play/pause is accessible and pause stays respected through opening, section navigation, and return',async()=>{
 const app=setup({blocked:true});await tick();app.allow();app.parts.get('button').emit('click');await tick();assert.equal(app.values.get('nico-kaye-music'),'playing');
 app.parts.get('button').emit('click');assert.equal(app.values.get('nico-kaye-music'),'paused');assert.equal(app.parts.get('button').attrs['aria-label'],'Play background music');
 const calls=app.audio.playCalls;app.opener.emit('click');app.window.emit('hashchange');app.window.emit('pagehide',{persisted:true});app.window.emit('pageshow',{persisted:true});await tick();assert.equal(app.audio.playCalls,calls);assert.equal(app.audio.paused,true);
 const returning=setup({preference:'paused'});await tick();assert.equal(returning.audio.playCalls,0);returning.opener.emit('click');await tick();assert.equal(returning.audio.playCalls,0);
});
test('pending play requests never overlap; explicit pause cancels the intent of a late play result',async()=>{
 const app=setup({deferred:true});app.opener.emit('click');app.opener.emit('click');assert.equal(app.audio.playCalls,1);app.parts.get('button').emit('click');app.resolve();await tick();assert.equal(app.audio.paused,true);assert.equal(app.values.get('nico-kaye-music'),'paused');
});
test('missing or failed audio is a nonintrusive, retryable state',async()=>{
 const app=setup({missing:true});await tick();assert.match(app.parts.get('.music-player__hint').textContent,/unavailable/);assert.equal(app.parts.get('button').attrs['aria-label'],'Retry background music');app.allow();app.parts.get('button').emit('click');await tick();assert.equal(app.audio.loadCalls,1);assert.equal(app.audio.paused,false);
 app.fail();assert.equal(app.parts.get('button').attrs['aria-label'],'Retry background music');app.allow();app.parts.get('button').emit('click');await tick();assert.equal(app.audio.paused,false);
});
test('storage restrictions do not prevent play or pause',async()=>{
 const app=setup({storageFails:true});await tick();app.parts.get('button').emit('click');assert.equal(app.audio.paused,true);app.parts.get('button').emit('click');await tick();assert.equal(app.audio.paused,false);
});
test('control avoids RSVP controls and open dialogs without interrupting playback',async()=>{
 const app=setup({protectedRect:{left:20,right:340,top:740,bottom:790,width:320,height:50}});await tick();app.flush();assert.ok(app.player.getBoundingClientRect().bottom<740);
 app.dialog.open=true;app.observers[0].callback();app.flush();assert.equal(app.player.hidden,true);assert.equal(app.audio.paused,false);
 app.dialog.open=false;app.observers[0].callback();app.flush();assert.equal(app.player.hidden,false);assert.equal(app.audio.paused,false);
 app.window.emit('submit');app.window.emit('hashchange');assert.equal(app.audio.playCalls,1);assert.equal(app.audio.pauseCalls,0);
});
test('page exit pauses playback and cleans listeners; bfcache return can resume if not manually paused',async()=>{
 const app=setup();await tick();app.window.emit('pagehide',{persisted:true});assert.equal(app.audio.paused,true);app.window.emit('pageshow',{persisted:true});await tick();assert.equal(app.audio.playCalls,2);
 app.window.emit('pagehide',{persisted:false});assert.equal(app.audio.paused,true);assert.equal(app.observers[0].disconnected,true);assert.equal(app.parts.get('button').events.get('click').size,0);
});
test('both pages reference exactly one existing audio source with metadata preload and looping',()=>{
 const path='assets/playlist/Palagi - By TJ.mp3';assert.ok(fs.statSync(path).size>0);
 for(const file of ['index.html','invite.html']){const html=fs.readFileSync(file,'utf8');assert.equal((html.match(/id="wedding-music"/g)||[]).length,1);assert.ok(html.includes('src="'+path+'" preload="metadata" loop'));assert.equal((html.match(/src="js\/music.js"/g)||[]).length,1);}
});

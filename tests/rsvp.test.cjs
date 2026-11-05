const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('js/rsvp.js','utf8');
const html=fs.readFileSync('index.html','utf8');
function setup({name='Test Guest',attendance='accepts',fetcher}={}){
  const requests=[],timers=[];
  class Field{
    constructor(){this.value='';this.checked=false;this.disabled=false;this.textContent='';this.attributes={};this.events={};}
    addEventListener(name,handler){this.events[name]=handler;}
    setAttribute(key,value){this.attributes[key]=value;}removeAttribute(key){delete this.attributes[key];}
    focus(){this.focused=true;}
  }
  const nameInput=new Field();nameInput.value=name;
  const choices=['accepts','declines'].map(value=>{const field=new Field();field.value=value;field.checked=value===attendance;return field;});
  const nameError=new Field(),attendanceError=new Field(),status=new Field(),button=new Field(),form=new Field();button.textContent='Send RSVP';
  const elements={'[name="guestName"]':nameInput,'#rsvp-name-error':nameError,'#rsvp-attendance-error':attendanceError,'[data-rsvp-status]':status,'[type="submit"]':button};
  for(const id of ['rsvp-name','rsvp-name-error','rsvp-attendance-error'])assert.ok(html.includes(`id="${id}"`));
  form.querySelector=selector=>elements[selector]||null;form.querySelectorAll=selector=>selector==='[name="attendance"]'?choices:[];
  const context={document:{querySelector:selector=>selector==='[data-rsvp-form]'?form:null},AbortController,
    window:{setTimeout:callback=>{timers.push(callback);return timers.length;},clearTimeout(){}},
    fetch:async(url,options)=>{requests.push({url,options});return fetcher?fetcher(url,options):{ok:true,type:'cors',json:async()=>({success:true})};}};
  vm.runInNewContext(source,context);
  const submit=()=>form.events.submit({preventDefault(){}});
  return {submit,requests,timers,nameInput,choices,nameError,attendanceError,status,button,form};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('invalid names or missing/unrecognized attendance never send a request',async()=>{
  for(const config of [{name:'   '},{attendance:null},{attendance:'unknown'}]){
    const app=setup(config);await app.submit();assert.equal(app.requests.length,0);assert.ok(app.nameError.textContent||app.attendanceError.textContent);
    assert.ok(app.nameInput.focused||app.choices[0].focused);
  }
  const app=setup();app.choices[0].value='constructor';await app.submit();assert.equal(app.requests.length,0);
});
for(const [choice,attendance,count] of [['accepts','Attending',1],['declines','Not Attending',0]]){
  test(`${choice} sends the exact separate weddingRSVP payload and waits for confirmed success`,async()=>{
    let resolve;const app=setup({name:'  Test Guest  ',attendance:choice,fetcher:()=>new Promise(r=>resolve=r)});
    const pending=app.submit();assert.equal(app.button.disabled,true);assert.equal(app.form.attributes['aria-busy'],'true');
    assert.equal(app.nameInput.disabled,true);assert.equal(app.choices[0].disabled,true);assert.doesNotMatch(app.status.textContent,/recorded/);
    await app.submit();assert.equal(app.requests.length,1);
    const {url,options}=app.requests[0];assert.equal(url,'https://script.google.com/macros/s/AKfycbzWx3lZB32C6YHdn5RWeEB3J1om33u7g-cZORQXqplpmVh2t2OTpx-MVtqTlEKdunoz/exec');
    assert.deepEqual(JSON.parse(options.body),{type:'weddingRSVP',guestName:'Test Guest',attendance,guestCount:count,message:'',invitationId:''});
    assert.equal(options.method,'POST');assert.equal(options.mode,'cors');assert.equal(options.redirect,'follow');assert.equal(options.credentials,'omit');assert.equal(options.headers['Content-Type'],'text/plain;charset=UTF-8');
    resolve({ok:true,type:'cors',json:async()=>({success:true,type:'weddingRSVP'})});await pending;
    assert.match(app.status.textContent,/Your RSVP has been recorded/);assert.equal(app.button.disabled,true);assert.equal(app.form.attributes['aria-busy'],undefined);assert.equal(app.nameInput.disabled,false);
    await app.submit();assert.equal(app.requests.length,1);
  });
}
test('only strict JSON success is accepted; ambiguous or rejected responses remain retryable',async()=>{
  const responses=[{ok:false,status:500},{ok:true,type:'opaque'},
    {ok:true,json:async()=>{throw Error('HTML login page');}},
    ...[{success:false,message:'private spreadsheet details'}, {success:'true'}, {}, {success:true,type:'roleResponse'}].map(payload=>({ok:true,type:'cors',json:async()=>payload}))];
  for(const response of responses){
    const app=setup({fetcher:async()=>response});await app.submit();assert.doesNotMatch(app.status.textContent,/has been recorded/);assert.doesNotMatch(app.status.textContent,/private spreadsheet/);
    assert.equal(app.button.disabled,false);assert.equal(app.nameInput.disabled,false);await app.submit();assert.equal(app.requests.length,2);
  }
});
test('network and timeout failures never claim success; controls restore and manual retry works',async()=>{
  for(const timeout of [false,true]){
    let attempt=0;const app=setup({fetcher:async(url,options)=>{attempt++;if(attempt>1)return {ok:true,json:async()=>({success:true})};
      if(!timeout)throw TypeError('Failed to fetch');return new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Error('Abort'))));}});
    const pending=app.submit();if(timeout)app.timers[0]();await pending;
    assert.match(app.status.textContent,/couldn't confirm whether/);assert.equal(app.button.disabled,false);assert.equal(app.button.textContent,'Send RSVP');
    await app.submit();assert.equal(app.requests.length,2);assert.match(app.status.textContent,/has been recorded/);
  }
});
test('confirmed payload is not resent, but changing guest details or attendance permits a new response',async()=>{
  const app=setup();await app.submit();assert.equal(app.requests.length,1);await app.submit();assert.equal(app.requests.length,1);
  app.nameInput.value='Another Test Guest';app.nameInput.events.input();assert.equal(app.button.disabled,false);await app.submit();assert.equal(app.requests.length,2);
  app.choices[0].checked=false;app.choices[1].checked=true;app.choices[1].events.change();assert.equal(app.button.disabled,false);await app.submit();assert.equal(app.requests.length,3);
});
test('input validation clears accessibly and the script tolerates pages without an RSVP form',async()=>{
  const app=setup({name:'',attendance:null});await app.submit();assert.equal(app.nameInput.attributes['aria-invalid'],'true');
  app.nameInput.value='Test Guest';app.nameInput.events.input();assert.equal(app.nameInput.attributes['aria-invalid'],undefined);assert.equal(app.nameError.textContent,'');
  app.choices[0].checked=true;app.choices[0].events.change();assert.equal(app.attendanceError.textContent,'');
  vm.runInNewContext(source,{document:{querySelector:()=>null}});
});

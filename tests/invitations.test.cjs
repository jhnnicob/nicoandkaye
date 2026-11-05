const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const dataSource=fs.readFileSync('js/invitation-data.js','utf8');
const renderer=fs.readFileSync('js/invite.js','utf8');
const template=fs.readFileSync('invite.html','utf8');
const ids=new Set([...template.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]));
function load(){const c={window:{}};vm.runInNewContext(dataSource,c);return c.window.WEDDING_INVITATIONS;}
const data=load();
function render(query,{payload={success:true},error=false,mutate=()=>{}}={}){
  const nodes=new Map(),requests=[],timers=[];
  class Element{
    constructor(){this.hidden=true;this.disabled=false;this.children=[];this.events={};this.attrs={};this.dataset={};this.classList={add(){}};}
    get textContent(){return this.value??this.children.map(c=>c.textContent).join('');}
    set textContent(v){this.value=v;this.children=[];}
    appendChild(c){this.children.push(c);} append(...children){this.children.push(...children);}
    addEventListener(event,handler){this.events[event]=handler;}
    setAttribute(name,value){this.attrs[name]=value;} removeAttribute(name){delete this.attrs[name];}
    focus(){} scrollIntoView(){}
  }
  const node=id=>{if(!nodes.has(id)){const n=new Element();n.disabled=['invitation-accept','invitation-decline'].includes(id);nodes.set(id,n);}return nodes.get(id);};
  const context={URL,URLSearchParams,AbortController,
    window:{location:{search:query},matchMedia:()=>({matches:true}),setTimeout:(callback,delay)=>{timers.push({callback,delay});return timers.length;},clearTimeout(){}},
    document:{body:{dataset:{}},getElementById:id=>ids.has(id)?node(id):null,querySelector:node,createElement:()=>new Element(),createTextNode:text=>({textContent:text})},
    fetch:async(url,options)=>{requests.push({url,options});if(error)throw Error('Network error');return {ok:true,json:async()=>payload};}};
  vm.runInNewContext(dataSource,context);mutate(context.window.WEDDING_INVITATIONS);
  vm.runInNewContext(renderer,context);
  return {node,requests,timers};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('all 17 records open against actual template IDs and preserve the letter text',()=>{
  assert.equal(Object.keys(data.invitations).length,17);
  for(const [id,r] of Object.entries(data.invitations)){
    const {node,timers,requests}=render('?to='+encodeURIComponent(id));
    assert.equal(node('invitation-experience').hidden,false);
    assert.equal(node('invitation-for').textContent,r.recipientName);
    assert.equal(node('letter-title').textContent,r.completeLetter.split('\n\n')[0]);
    assert.equal(node('letter-signature').children[2].textContent,r.signature.split('\n').at(-1));
    // Every rendered paragraph/list has the exact original words and ordering.
    const body=r.completeLetter.split('\n\n').slice(1,-1).map(p=>p.split('\n').every(line=>line.startsWith('• '))?p.replaceAll('• ','').replaceAll('\n',''):p);
    assert.deepEqual(node('letter-copy').children.map(p=>p.textContent),body);
    node('invitation-open').events.click();
    timers.find(t=>t.delay===0).callback();
    assert.equal(node('invitation-letter').hidden,false);
    assert.equal(node('invitation-envelope-area').hidden,true);
    assert.equal(requests.length,0);
  }
});
test('unknown, missing, duplicate and malformed records fail safely',()=>{
  for(const query of ['','?to=unknown','?to=__proto__','?to=constructor','?to=x&to=y']){
    const {node}=render(query);assert.equal(node('invitation-error').hidden,false);assert.equal(node('invitation-experience').hidden,true);
    assert.equal(node('invitation-for').textContent,'');
  }
  const {node}=render('?to=katrisse',{mutate:d=>d.invitations.katrisse.signature='Wrong signature'});
  assert.equal(node('invitation-error').hidden,false);
});
test('gown exceptions, individual relationships, and Arjay special letter are preserved',()=>{
  const ps='P.S. Bride Squad uniform: any long bridesmaid gown in chocolate or dark brown. Choose the style you love and feel your absolute best in!';
  for(const id of ['zhalan','katrisse','katrine'])assert.equal(data.invitations[id].completeLetter.split(ps).length-1,1);
  for(const r of [data.invitations.krysnah,Object.values(data.invitations).find(r=>r.recipientName==='AJ')]){
    assert.doesNotMatch(r.completeLetter,/Bride Squad uniform/);assert.equal(r.postscript,undefined);
  }
  for(const id of ['katrisse','katrine'])assert.match(data.invitations[id].completeLetter,/your kuya Nico/);
  assert.match(data.invitations.cj.completeLetter,/your Tita K/);
  for(const text of ['Ops Solution','Environment: Production','Go-Live: 01.29.27','Status: Successfully committed','repository.'])assert.ok(data.invitations.arjay.completeLetter.includes(text));
  assert.doesNotMatch(data.invitations.arjay.completeLetter,/Groomsmen uniform/);
  for(const id of ['cj','ressie','rjay'])assert.match(data.invitations[id].completeLetter,/P.S. Groomsmen uniform: black suit\/coat, black pants, and a white inner. Don’t worry about the finishing touch, the bow tie is on us!/);
  assert.equal(data.invitations.zhalan.fullName,null);assert.equal(data.invitations.cj.fullName,null);
});
test('sponsor P.S. is removed and attire guides/images render only where configured',()=>{
  for(const [id,r] of Object.entries(data.invitations)){
    const {node}=render('?to='+id),guide=data.attireGuides[r.attireGuide];
    if(r.role.startsWith('Principal Sponsor')){assert.equal(r.postscript,undefined);assert.equal(node('letter-postscript').hidden,true);}
    if(guide){assert.equal(node('invitation-attire').hidden,!guide.instructions && (!guide.image || !!r.hideAttireImage));assert.equal(node('invitation-attire-copy').textContent,guide.instructions);}
    if(guide?.image && !r.hideAttireImage){assert.equal(node('invitation-attire-image').hidden,false);assert.equal(node('invitation-attire-image').src,guide.image);assert.ok(fs.existsSync(guide.image));assert.ok(guide.imageAlt);}
    else assert.equal(node('invitation-attire-image').hidden,true);
  }
});
test('new records have disabled response controls until exact sheet IDs are supplied',()=>{
  for(const id of ['zhalan','katrisse','katrine','krysnah','arjay','cj','ressie','rjay']){
    const {node,requests}=render('?to='+id);assert.equal(data.invitations[id].responseInvitationId,null);
    assert.equal(node('invitation-accept').disabled,true);assert.equal(node('invitation-decline').disabled,true);assert.equal(requests.length,0);
    assert.equal(node('invitation-contact-note').hidden,true);
    assert.equal(node('invitation-accept').attrs['aria-describedby'],'invitation-contact-note');
    assert.match(node('invitation-accept').attrs.title,/Responses are not available yet/);
  }
});
for(const [button,response] of [['accept','Accepted'],['decline','Declined']]){
  test(`mock ${response} uses existing API contract and prevents duplicate submissions`,async()=>{
    const {node,requests}=render('?to=test-_Vsxx1cjSi4LQxDJ');
    node('invitation-'+button).events.click();node('invitation-'+button).events.click();
    assert.equal(node('invitation-accept').disabled,true);await tick();
    assert.equal(requests.length,1);assert.equal(requests[0].url,data.responseApi.url);
    assert.deepEqual(JSON.parse(requests[0].options.body),{invitationId:'test-wedding-2026',response});
    assert.equal(requests[0].options.headers['Content-Type'],'text/plain;charset=UTF-8');
    assert.match(node('invitation-response-status').textContent,/recorded/);
  });
}
test('not found permits retry; already answered and uncertain errors remain locked',async()=>{
  for(const config of [{payload:{success:false,message:'Invitation not found'}},{payload:{success:false,message:'Invitation already answered'}},{error:true}]){
    const {node,requests}=render('?to=test-_Vsxx1cjSi4LQxDJ',config);node('invitation-accept').events.click();await tick();
    const retry=config.payload?.message==='Invitation not found';assert.equal(node('invitation-accept').disabled,!retry);
    assert.doesNotMatch(node('invitation-response-status').textContent,/has been recorded/);
    node('invitation-accept').events.click();await tick();assert.equal(requests.length,retry?2:1);
  }
});
test('new route keeps queries and old links use the same template',()=>{
  let destination;
  const location={href:'http://192.168.1.28:5500/invite/?to=katrisse',search:'?to=katrisse',hash:'#letter',replace:url=>destination=url};
  vm.runInNewContext(fs.readFileSync('js/invite-route.js','utf8'),{URL,window:{location},document:{getElementById:()=>({})}});
  assert.equal(destination,'http://192.168.1.28:5500/invite.html?to=katrisse#letter');
});

test('every invitation has one consistent name-based ID; all old links still open the same letter',()=>{
  for(const [key,record] of Object.entries(data.invitations)){
    assert.match(key,/^[a-z]+(?:-[a-z]+)*$/);
    assert.equal(record.id,key);
    assert.equal(record.recipientId,key);
    assert.equal(record.urlIdentifier,key);
  }
  for(const [alias,canonical] of Object.entries(data.aliases)){
    assert.ok(!Object.hasOwn(data.invitations,alias));
    assert.ok(Object.hasOwn(data.invitations,canonical));
    const {node}=render('?to='+encodeURIComponent(alias));
    assert.equal(node('invitation-experience').hidden,false);
    assert.equal(node('invitation-for').textContent,data.invitations[canonical].recipientName);
    assert.equal(node('letter-title').textContent,data.invitations[canonical].completeLetter.split('\n\n')[0]);
  }
  assert.equal(data.aliases.katryn,'katrine');
});

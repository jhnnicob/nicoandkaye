const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
const source=fs.readFileSync('js/gallery.js','utf8');
const photos=vm.runInNewContext(source+'\ngalleryImages',{document:{querySelector:()=>null}});
function jpegDimensions(path){
 const data=fs.readFileSync(path);assert.equal(data.readUInt16BE(0),0xffd8);let index=2;
 while(index<data.length){while(data[index]===0xff)index++;const marker=data[index++];if(marker===0xd9||marker===0xda)break;const length=data.readUInt16BE(index);if([0xc0,0xc1,0xc2].includes(marker))return {height:data.readUInt16BE(index+3),width:data.readUInt16BE(index+5)};index+=length;}
 throw Error('No JPEG dimensions: '+path);
}
test('every gallery photo has a real, bounded preview and preserves its original aspect ratio',()=>{
 assert.equal(photos.length,74);const sources=new Set();
 for(const photo of photos){assert.ok(photo.source.startsWith('assets/gallery/previews/'));assert.ok(!sources.has(photo.source));sources.add(photo.source);
  const preview=jpegDimensions(photo.source),original=jpegDimensions('assets/gallery/'+photo.filename);
  assert.ok(preview.width>1&&preview.height>1,photo.filename);assert.ok(Math.max(preview.width,preview.height)<=1600,photo.filename);
  assert.ok(Math.abs(preview.width/preview.height-original.width/original.height)<.005,photo.filename);
 }
});
test('preview download size is substantially smaller while all originals remain available',()=>{
 const totals=photos.reduce((result,photo)=>({preview:result.preview+fs.statSync(photo.source).size,original:result.original+fs.statSync('assets/gallery/'+photo.filename).size}),{preview:0,original:0});
 assert.ok(totals.preview<totals.original*.25,JSON.stringify(totals));
});

import {readFileSync,existsSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import path from 'node:path';

const root=process.cwd(),publicDir=path.join(root,'public');
const html=readFileSync(path.join(publicDir,'index.html'),'utf8');
const config=JSON.parse(readFileSync(path.join(root,'vercel.json'),'utf8'));
const hashes=JSON.parse(readFileSync(path.join(publicDir,'downloads','SHA256.json'),'utf8'));
const version=JSON.parse(readFileSync(path.join(root,'package.json'),'utf8')).version;
assert.equal(config.outputDirectory,'public');assert.equal(config.framework,null);assert.equal(config.installCommand,'');
assert.equal(config.rewrites,undefined,'APK requests must not be rewritten to HTML.');
let checked=0;
for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g)){
 const link=match[1];if(link.startsWith('#')||/^https?:/.test(link))continue;
 assert(link.startsWith('/'),'Use origin-relative links: '+link);
 const target=path.join(publicDir,link);assert(target.startsWith(publicDir+path.sep));assert(existsSync(target),'Missing link target: '+link);checked++;
}
assert.equal((html.match(/download="PhoneMirror-[^"]+\.apk"/g)||[]).length,2);
for(const [name,expected] of Object.entries(hashes)){
 assert(name.endsWith('.apk'));const bytes=readFileSync(path.join(publicDir,'downloads',name));assert.equal(bytes.readUInt32LE(0),0x04034b50,'Invalid APK ZIP header');
 assert.equal(createHash('sha256').update(bytes).digest('hex'),expected,'APK checksum mismatch: '+name);
 assert(bytes.length>1_000_000&&bytes.length<100_000_000);assert(name.endsWith('-'+version+'.apk'),'Published APK must match site version');
 assert(html.includes('/downloads/'+name),'Published APK must be linked');console.log('Verified APK:',name,'('+bytes.length+' bytes)');
}
assert.equal(Object.keys(hashes).length,2);assert(html.includes('lang="fr"'));assert(html.includes('name="viewport"'));assert(html.includes('Bêta'));
console.log('Static page ready for Vercel; '+checked+' local links verified. No dependencies or secrets required.');

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {riskTiers} from './config/targets.mjs';
import {classify} from './modules/riskAssessment.mjs';
import {treatmentStatus} from './modules/treatmentStatus.mjs';
import {recommendDrugs} from './modules/drugRecommendation.mjs';

test('relative ESM dependency graph is complete and precached under repository subpath',()=>{
 const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
 assert.match(html,/<script type="module" src="\.\/app.mjs"><\/script>/);
 assert.doesNotMatch(html,/onclick=/);
 assert.match(html,/href="\.\.\/"/);
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 const visited=new Set();
 function visit(url){
  if(visited.has(url.href))return;visited.add(url.href);
  assert.ok(existsSync(url),url.href);
  const relative=fileURLToPath(url).split('/lipid/')[1];
  assert.ok(sw.includes(`'./lipid/${relative}'`),`missing precache ${relative}`);
  const code=readFileSync(url,'utf8');
  for(const [,path] of code.matchAll(/(?:import|export)\s[^;]*?from\s*['"]([^'"]+)['"]/g)){
   assert.match(path,/^\.{1,2}\//);visit(new URL(path,url));
  }
 }
 visit(new URL('./app.mjs',import.meta.url));assert.equal(visited.size,11);
});

test('target, initial threshold and continued-treatment status stay independent',()=>{
 const v={mode:'quick',riskTier:'high',ldl:90,statinStatus:'ge3m'};
 const r=classify(v), status=treatmentStatus(v,r);
 assert.equal(status.atGoal,true);assert.equal(status.ongoing,true);
 const recommendation=recommendDrugs(v,r,'07109');
 assert.equal(recommendation.main[0].assessment.status,'可維持既有 statin 治療');
 // A future target change must not silently change the initial treatment threshold.
 const original=riskTiers.high.goal;
 try{riskTiers.high.goal=80;const changed=classify(v);assert.equal(changed.threshold,100);assert.equal(treatmentStatus(v,changed).atGoal,false);}
 finally{riskTiers.high.goal=original;}
});

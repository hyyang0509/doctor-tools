import {table2Only,ez3mCodes,combo3mCodes} from '../config/nhi.mjs';
function drugRule(d){
 if(table2Only.some(x=>x[1]===d.code)) return 'table2';
 if(d.kind==='ez') return ez3mCodes.has(d.code)?'ez3':'ez6';
 if(d.kind==='combo') return combo3mCodes.has(d.code)?'combo3':'combo6';
 if(d.kind==='statin'&&/^[A-Z]{1,2}[0-9]{8,9}$/.test(d.code)) return 'table1';
 return 'other';
}

function drugPolicy(d){
 const rule=drugRule(d);
 return {rule,table:rule==='table2'?2:rule==='other'?null:1,
  targetTable:rule==='table2'?2:rule==='other'?null:1,
  minimumMonotherapy:rule.endsWith('3')?'3months':/^(ez|combo)6$/.test(rule)?'6weeks':null};
}
export {drugRule,drugPolicy};

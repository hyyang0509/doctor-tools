import {hospitalDrugs} from '../config/drugs.mjs';
import {drugRule} from './drugPolicy.mjs';
import {assessDrug} from './nhiEligibility.mjs';
export function recommendDrugs(v,r,selected='') {
 const ds=selected?hospitalDrugs.filter(d=>d.id===selected):hospitalDrugs.filter(d=>['statin','ez','combo'].includes(d.kind));
 const entries=ds.map(drug=>({drug,assessment:assessDrug(drug,v,r),rule:drugRule(drug)}));
 return {main:entries.filter(x=>x.rule!=='table2'),table2:entries.filter(x=>x.rule==='table2'),selected:!!selected};
}

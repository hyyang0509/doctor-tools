import {monotherapy} from '../config/nhi.mjs';
export function treatmentStatus(v,r) {
 return {atGoal:r.ldl<r.goal, ongoing:v.statinStatus!=='none', intolerant:v.statinStatus==='intolerant',
  completeRecords:v.records==='yes',
  monotherapyEligible:Object.fromEntries(Object.entries(monotherapy).map(([key,rule])=>[key,rule.statuses.includes(v.statinStatus)]))};
}

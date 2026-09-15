// 起始門檻與目標保留獨立欄位；目前依已確認規則共用同一分界。
const tier = (risk, cutoff, nonHdl, optionLabel, shortLabel) =>
 ({risk,threshold:cutoff,goal:cutoff,nonHdl,optionLabel,shortLabel});
export const riskTiers = {
 extreme:tier('極高風險',55,85,'極高風險','極高'),
 veryHigh:tier('非常高風險',70,100,'非常高風險','非常高'),
 high:tier('高風險',100,130,'高風險','高'),
 moderate:tier('中風險',115,145,'中風險','中'),
 low:tier('低風險',130,160,'低風險','低'),
 none:tier('0 項心血管風險因子',160,null,'0 項風險因子','0 項風險因子')
};
export const riskParameters = {highLdl:190, age:{M:45,F:55}, lowHdl:{M:40,F:50}, metabolicCount:3};
export const inputLimits = [['age','年齡',120],['ldl','LDL-C',2000],['hdl','HDL-C',500],['tc','總膽固醇',3000],['baseline','治療前 LDL-C',2000]];

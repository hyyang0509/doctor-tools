// 來源：使用者提供院內品項截圖，2026-09-10。保留不完整代碼，不自行補碼。
const hospitalDrugs = [
  {
    "id": "07158",
    "code": "YC00018209",
    "name": "(罕) Repatha 140 mg/mL",
    "ingredient": "evolocumab",
    "kind": "other"
  },
  {
    "id": "07168",
    "code": "BC28181100",
    "name": "脂瑞妥 Cretrol 10/10 mg",
    "ingredient": "ezetimibe 10 mg / rosuvastatin 10 mg",
    "kind": "combo"
  },
  {
    "id": "07169",
    "code": "BC28182100",
    "name": "脂瑞妥 Cretrol 10/20 mg",
    "ingredient": "ezetimibe 10 mg / rosuvastatin 20 mg",
    "kind": "combo"
  },
  {
    "id": "07135",
    "code": "AC55272100",
    "name": "立舒脂 Atorva 10 mg",
    "ingredient": "atorvastatin",
    "kind": "statin"
  },
  {
    "id": "21227",
    "code": "X",
    "name": "家可士塔 Juxtapid 10 mg",
    "ingredient": "lomitapide",
    "kind": "other"
  },
  {
    "id": "07109",
    "code": "BC22886100",
    "name": "立普妥 Lipitor 10 mg",
    "ingredient": "atorvastatin",
    "kind": "statin"
  },
  {
    "id": "07156",
    "code": "AB47228100",
    "name": "祛脂優 Fenolip-U 160 mg",
    "ingredient": "fenofibrate",
    "kind": "other"
  },
  {
    "id": "07112",
    "code": "AC42619100",
    "name": "祛脂 Fenolip 200 mg",
    "ingredient": "fenofibrate",
    "kind": "other"
  },
  {
    "id": "07159",
    "code": "AC55583100",
    "name": "柔脂膜 Atorcal 20 mg",
    "ingredient": "atorvastatin",
    "kind": "statin"
  },
  {
    "id": "21228",
    "code": "X",
    "name": "家可士塔 Juxtapid 20 mg",
    "ingredient": "lomitapide",
    "kind": "other"
  },
  {
    "id": "07161",
    "code": "AC58813100",
    "name": "絡益達 Rozin 20 mg",
    "ingredient": "rosuvastatin",
    "kind": "statin"
  },
  {
    "id": "07136",
    "code": "AC55268100",
    "name": "立舒脂 Atorva 40 mg",
    "ingredient": "atorvastatin",
    "kind": "statin"
  },
  {
    "id": "07171",
    "code": "AC58822100",
    "name": "絡益達 Rozin 5 mg",
    "ingredient": "rosuvastatin",
    "kind": "statin"
  },
  {
    "id": "07155",
    "code": "AC59251100",
    "name": "愛脂婷 Agitin 10/20 mg",
    "ingredient": "ezetimibe 10 mg / simvastatin 20 mg",
    "kind": "combo"
  },
  {
    "id": "07162",
    "code": "BC27283100",
    "name": "優泰脂 Atozet 10/20 mg",
    "ingredient": "ezetimibe 10 mg / atorvastatin 20 mg",
    "kind": "combo"
  },
  {
    "id": "07084",
    "code": "BC24392100",
    "name": "脂脈優 Caduet 5/20 mg",
    "ingredient": "amlodipine 5 mg / atorvastatin 20 mg",
    "kind": "mixed"
  },
  {
    "id": "07163",
    "code": "AB49143100",
    "name": "安樂脂 Dehypotin 40 mg",
    "ingredient": "pravastatin",
    "kind": "statin"
  },
  {
    "id": "07113",
    "code": "AC39307100",
    "name": "舒脂錠 Delipic 20 mg",
    "ingredient": "lovastatin",
    "kind": "statin"
  },
  {
    "id": "07178",
    "code": "AC60610100",
    "name": "怡優脂 Ezetity 10 mg",
    "ingredient": "ezetimibe",
    "kind": "ez"
  },
  {
    "id": "07165",
    "code": "BC27311100",
    "name": "易吉妥 Ezzicad 10 mg",
    "ingredient": "ezetimibe",
    "kind": "ez"
  },
  {
    "id": "07103",
    "code": "AC358381G0",
    "name": "健比得 Gembit 300 mg",
    "ingredient": "gemfibrozil",
    "kind": "other"
  },
  {
    "id": "07175",
    "code": "B028761",
    "name": "樂脂益 Leqvio 284 mg/1.5 mL",
    "ingredient": "inclisiran",
    "kind": "other"
  },
  {
    "id": "07137",
    "code": "AC57216100",
    "name": "理脂膜 Linicor 500/20 mg",
    "ingredient": "niacin 500 mg / lovastatin 20 mg",
    "kind": "other"
  },
  {
    "id": "07114",
    "code": "BC22889100",
    "name": "立普妥 Lipitor 40 mg",
    "ingredient": "atorvastatin",
    "kind": "statin"
  },
  {
    "id": "07157",
    "code": "BC27002100",
    "name": "力清之口溶錠 Livalo OD 2 mg",
    "ingredient": "pitavastatin",
    "kind": "statin"
  },
  {
    "id": "07116",
    "code": "AC44461100",
    "name": "清血 Low-Lip 67 mg",
    "ingredient": "fenofibrate",
    "kind": "other"
  },
  {
    "id": "07177",
    "code": "B028817",
    "name": "寧脂德 Nilemdo 180 mg",
    "ingredient": "bempedoic acid",
    "kind": "other"
  },
  {
    "id": "07147",
    "code": "A059019",
    "name": "脂妙清 Omacor 1000 mg",
    "ingredient": "omega-3-acid ethyl esters 90",
    "kind": "other"
  },
  {
    "id": "07142",
    "code": "AA57372100",
    "name": "必抑脂 Pitator 2 mg",
    "ingredient": "pitavastatin",
    "kind": "statin"
  },
  {
    "id": "07167",
    "code": "AC59398100",
    "name": "必脂舒 Pivas 2 mg",
    "ingredient": "pitavastatin",
    "kind": "statin"
  },
  {
    "id": "07151",
    "code": "KC01037209",
    "name": "保脂通 Praluent 75 mg/mL",
    "ingredient": "alirocumab",
    "kind": "other"
  },
  {
    "id": "07145",
    "code": "BC26169100",
    "name": "普脂芬 Pravafen 40/160 mg",
    "ingredient": "pravastatin 40 mg / fenofibrate 160 mg",
    "kind": "mixed"
  },
  {
    "id": "07152",
    "code": "KC01033209",
    "name": "瑞百安 Repatha 140 mg/mL",
    "ingredient": "evolocumab",
    "kind": "other"
  },
  {
    "id": "07146",
    "code": "AB57940100",
    "name": "利降脂 Rosulator 10 mg",
    "ingredient": "rosuvastatin",
    "kind": "statin"
  },
  {
    "id": "07176",
    "code": "AC61165100",
    "name": "同抑脂 Tonvasca 2/10 mg",
    "ingredient": "pitavastatin 2 mg / ezetimibe 10 mg",
    "kind": "combo"
  },
  {
    "id": "07149",
    "code": "AC58639100",
    "name": "平脂膜 Zulitor 4 mg",
    "ingredient": "pitavastatin",
    "kind": "statin"
  }
];
if(typeof module!=="undefined") module.exports=hospitalDrugs;

/** الضمانات والشهادات المعتمدة المعروضة في عرض السعر وملف الطباعة. */

export const WARRANTY_ROWS: { item: string; period: string }[] = [
  { item: "الألواح الشمسية", period: "12 سنة على الصنف | 25 سنة على الأداء" },
  { item: "الإنفرتر", period: "5 سنوات" },
  { item: "بطاريات الليثيوم", period: "5 سنوات" },
  { item: "اللوحات والكابلات ومستلزمات التركيب", period: "سنة واحدة" },
  { item: "التركيب والتشغيل", period: "سنة واحدة على عمل التركيب" },
];

export const CERTIFICATES: string[] = [
  "TÜV Rheinland",
  "IEC 61215 / IEC 61730",
  "IEC 62109-1 / 62109-2",
  "IEC 62619 / UN38.3",
  "UL 1973",
  "CE",
  "ISO 9001",
];

export const WARRANTY_TITLE = "الضمانات";
export const CERTIFICATES_TITLE = "الشهادات المعتمدة";

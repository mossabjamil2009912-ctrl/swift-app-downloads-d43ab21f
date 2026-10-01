/**
 * نموذج هندسي لحساب الإشعاع الساقط على سطح مائل (Transposition Model).
 *
 * يُستخدم لإعادة حساب الإشعاع على مستوى الألواح GlobInc عند تغيير زاوية
 * الميلان (Tilt) أو زاوية الاتجاه (Azimuth) عن القيمة الافتراضية للموقع.
 *
 * المنهجية: نموذج السماء المتجانس (Isotropic / Liu-Jordan) بتكامل زمني
 * على مدار اليوم التمثيلي لكل شهر:
 *   GlobInc = Bt (المباشر على المائل) + Dt (المنتشر) + Rt (المنعكس أرضياً)
 * ويُرجَع المعامل النسبي GlobInc / GlobHor، فيُستخدم كنسبة بين زاويتين
 * بحيث تبقى القيم الافتراضية مطابقة تماماً لبيانات Meteonorm المخزّنة.
 */

const RAD = Math.PI / 180;

/** اليوم التمثيلي لكل شهر (Klein) */
const REP_DAY = [17, 47, 75, 105, 135, 162, 198, 228, 258, 288, 318, 344];

/** معامل انعكاس الأرض (Albedo) القياسي في تقارير PVsyst. */
const ALBEDO = 0.2;

/** نسبة الإشعاع المنتشر الافتراضية عند غياب بيانات DiffHor. */
const DEFAULT_DIFFUSE_FRACTION = 0.3;

/**
 * معامل تحويل الإشعاع الأفقي إلى الإشعاع على سطح مائل لشهر محدد.
 *
 * @param lat خط العرض بالدرجات (موجب شمالاً)
 * @param tiltDeg زاوية ميلان اللوح عن الأفقي (0 = أفقي)
 * @param azimDeg زاوية الاتجاه: 0 = جنوب، سالب = شرق، موجب = غرب
 * @param monthIndex رقم الشهر 0-11
 * @param diffuseFraction نسبة الإشعاع المنتشر من الكلي (0-1)
 */
export function transpositionFactor(
  lat: number,
  tiltDeg: number,
  azimDeg: number,
  monthIndex: number,
  diffuseFraction = DEFAULT_DIFFUSE_FRACTION,
): number {
  const phi = lat * RAD;
  const beta = tiltDeg * RAD;
  const gamma = azimDeg * RAD;
  const n = REP_DAY[monthIndex] ?? 180;
  const delta = 23.45 * RAD * Math.sin(2 * Math.PI * ((284 + n) / 365));

  const kd = Math.min(0.95, Math.max(0.05, diffuseFraction));
  const kb = 1 - kd;

  // التكامل على مدار اليوم بخطوة 5 دقائق
  const stepDeg = 1.25;
  let sumHor = 0;
  let sumBeamTilt = 0;

  for (let omegaDeg = -180 + stepDeg / 2; omegaDeg < 180; omegaDeg += stepDeg) {
    const omega = omegaDeg * RAD;
    const cosZ = Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.cos(omega);
    if (cosZ <= 0.02) continue; // الشمس تحت الأفق أو قريبة جداً منه

    // زاوية سقوط الأشعة على السطح المائل
    const cosTheta =
      Math.sin(delta) * Math.sin(phi) * Math.cos(beta) -
      Math.sin(delta) * Math.cos(phi) * Math.sin(beta) * Math.cos(gamma) +
      Math.cos(delta) * Math.cos(phi) * Math.cos(beta) * Math.cos(omega) +
      Math.cos(delta) * Math.sin(phi) * Math.sin(beta) * Math.cos(gamma) * Math.cos(omega) +
      Math.cos(delta) * Math.sin(beta) * Math.sin(gamma) * Math.sin(omega);

    sumHor += cosZ;
    if (cosTheta > 0) sumBeamTilt += cosTheta;
  }

  if (sumHor <= 0) return 1;

  // Rb = متوسط نسبة المباشر على المائل إلى المباشر على الأفقي
  const rb = sumBeamTilt / sumHor;
  const diffuseView = (1 + Math.cos(beta)) / 2;
  const groundView = (1 - Math.cos(beta)) / 2;

  return kb * rb + kd * diffuseView + ALBEDO * groundView;
}

/**
 * معامل إعادة الحساب بين زاويتين: يُرجع نسبة الإشعاع عند الزاوية الجديدة
 * إلى الإشعاع عند الزاوية الافتراضية المخزّنة، لكل شهر.
 */
export function tiltAdjustmentFactors(
  lat: number,
  baseTilt: number,
  newTilt: number,
  newAzimuth: number,
  diffuseFractions?: (number | null)[],
): number[] {
  return Array.from({ length: 12 }, (_, m) => {
    const kd = diffuseFractions?.[m] ?? DEFAULT_DIFFUSE_FRACTION;
    const base = transpositionFactor(lat, baseTilt, 0, m, kd);
    const next = transpositionFactor(lat, newTilt, newAzimuth, m, kd);
    if (!base || !Number.isFinite(base) || !Number.isFinite(next)) return 1;
    return next / base;
  });
}

/** خيارات زاوية الاتجاه المعروضة للمستخدم. */
export const AZIMUTH_OPTIONS: { value: number; label: string; en: string }[] = [
  { value: -90, label: "شرق", en: "East (-90°)" },
  { value: -45, label: "جنوب شرق", en: "South-East (-45°)" },
  { value: 0, label: "جنوب", en: "South (0°)" },
  { value: 45, label: "جنوب غرب", en: "South-West (+45°)" },
  { value: 90, label: "غرب", en: "West (+90°)" },
];

export function azimuthLabel(value: number): string {
  const hit = AZIMUTH_OPTIONS.find((o) => o.value === value);
  return hit ? hit.en : `${value}°`;
}

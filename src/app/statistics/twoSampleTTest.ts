// welchTTest.ts

export interface WelchResult {
  mean1: number;
  mean2: number;
  diff: number;
  t: number;
  df: number;
  pTwoTailed: number;
  ci95: [number, number];
}

export function welchTTest(
  sample1: number[],
  sample2: number[],
  alpha: number = 0.05
): WelchResult {
  const n1 = sample1.length;
  const n2 = sample2.length;

  if (n1 < 2 || n2 < 2) {
    throw new Error("Each sample must have at least 2 points.");
  }

  const mean1 = sample1.reduce((a, b) => a + b, 0) / n1;
  const mean2 = sample2.reduce((a, b) => a + b, 0) / n2;

  const var1 = sample1.reduce((a, b) => a + (b - mean1) ** 2, 0) / (n1 - 1);
  const var2 = sample2.reduce((a, b) => a + (b - mean2) ** 2, 0) / (n2 - 1);

  const se = Math.sqrt(var1 / n1 + var2 / n2);
  const t = (mean1 - mean2) / se;

  // Welch–Satterthwaite degrees of freedom
  const df =
    (var1 / n1 + var2 / n2) ** 2 /
    ((var1 ** 2) / ((n1 - 1) * n1 ** 2) + (var2 ** 2) / ((n2 - 1) * n2 ** 2));

  // Two-tailed p-value using Student's t CDF
  const pTwoTailed = 2 * (1 - tCDF(Math.abs(t), df));

  // Critical t value for CI
  const tcrit = tInv(1 - alpha / 2, df);
  const ciLow = (mean1 - mean2) - tcrit * se;
  const ciHigh = (mean1 - mean2) + tcrit * se;

  return {
    mean1,
    mean2,
    diff: mean1 - mean2,
    t,
    df,
    pTwoTailed,
    ci95: [ciLow, ciHigh]
  };
}

/* ---------- t-distribution helper functions ---------- */

function ibeta(x: number, a: number, b: number): number {
  const bt =
    x === 0 || x === 1
      ? 0
      : Math.exp(
          lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x)
        );

  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betacf(x, a, b)) / a;
  } else {
    return 1 - (bt * betacf(1 - x, b, a)) / b;
  }
}

function betacf(x: number, a: number, b: number): number {
  const MAX_ITER = 100;
  const EPS = 3e-7;
  let am = 1,
    bm = 1,
    az = 1,
    qab = a + b,
    qap = a + 1,
    qam = a - 1;
  let bz = 1 - (qab * x) / qap;

  for (let m = 1; m <= MAX_ITER; m++) {
    const em = m;
    const tem = em + em;
    const d = (em * (b - m) * x) / ((qam + tem) * (a + tem));
    const ap = az + d * am;
    const bp = bz + d * bm;
    const d2 = (-(a + em) * (qab + em) * x) / ((a + tem) * (qap + tem));
    const app = ap + d2 * az;
    const bpp = bp + d2 * bz;
    const aold = az;
    am = ap / bpp;
    bm = bp / bpp;
    az = app / bpp;
    bz = 1;
    if (Math.abs(az - aold) < EPS * Math.abs(az)) return az;
  }
  return az;
}

function lgamma(z: number): number {
  const cof = [
    76.18009172947146,
    -86.50532032941677,
    24.01409824083091,
    -1.231739572450155,
    0.1208650973866179e-2,
    -0.5395239384953e-5
  ];
  let x = z;
  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j <= 5; j++) ser += cof[j] / ++y;
  return Math.log(2.5066282746310005 * ser / x) - tmp;
}

function tCDF(t: number, df: number): number {
  const x = df / (df + t * t);
  const a = df / 2;
  const b = 0.5;
  const ib = ibeta(x, a, b);
  return 1 - 0.5 * ib;
}

function tInv(p: number, df: number): number {
  const a = 1 / (df - 0.5);
  const b = 48 / (a * a);
  const c = ((20700 * a) / b - 98) * a - 16;
  const d = ((a * ((94.5 / (b + c)) - 3)) * a) + 1;
  const y = Math.sqrt(df * (Math.pow(pInvNorm(p), 2) / d));
  return y;
}

function pInvNorm(p: number): number {
  const a1 = -39.6968302866538,
    a2 = 220.946098424521,
    a3 = -275.928510446969,
    a4 = 138.357751867269,
    a5 = -30.6647980661472,
    a6 = 2.50662827745924;
  const b1 = -54.4760987982241,
    b2 = 161.585836858041,
    b3 = -155.698979859887,
    b4 = 66.8013118877197,
    b5 = -13.2806815528857;
  const c1 = -0.00778489400243029,
    c2 = -0.322396458041136,
    c3 = -2.40075827716184,
    c4 = -2.54973253934373,
    c5 = 4.37466414146497,
    c6 = 2.93816398269878;
  const d1 = 0.00778469570904146,
    d2 = 0.32246712907004,
    d3 = 2.44513413714299,
    d4 = 3.75440866190742;

  const plow = 0.02425;
  const phigh = 1 - plow;
  let q: number, r: number;
  if (p < plow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
      ((((d1 * q + d2) * q + d3) * q + d4) * q + 1)
    );
  } else if (phigh < p) {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(
      ((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6
    ) /
    ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  } else {
    q = p - 0.5;
    r = q * q;
    return (
      (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q /
      (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1)
    );
  }
}

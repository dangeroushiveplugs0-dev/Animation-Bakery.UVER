export type PerformanceLevel = "excellent" | "good" | "heavy" | "very-heavy";

export function getPerformanceLevel(triangles:number, drawCalls:number, textureMB:number):PerformanceLevel{
  const score=Math.max(triangles/150000,drawCalls/80,textureMB/96);
  if(score<=0.45)return "excellent";
  if(score<=0.9)return "good";
  if(score<=1.8)return "heavy";
  return "very-heavy";
}

export function performanceLabel(level:PerformanceLevel):string{
  return level==="excellent"?"Excellent":level==="good"?"Good":level==="heavy"?"Heavy":"Very Heavy";
}

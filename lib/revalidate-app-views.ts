import { revalidatePath } from "next/cache";

/** 计划写入后：清除 Next.js 服务端页面缓存，避免刷新仍看到旧 RSC 数据 */
export function revalidatePlanAppViews() {
  revalidatePath("/plans");
  revalidatePath("/gantt");
  revalidatePath("/calendar");
  revalidatePath("/summary");
  revalidatePath("/feed");
  revalidatePath("/");
}

export function revalidateMemoAppViews() {
  revalidatePath("/memos");
  revalidatePath("/feed");
  revalidatePath("/");
}

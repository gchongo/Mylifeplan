import type { LanguagePreference } from "@/lib/user-preferences";
import zhCN from "@/lib/i18n/messages/zh-CN";

type DeepStringRecord<T> = T extends string
  ? string
  : { [K in keyof T]: DeepStringRecord<T[K]> };

export type MessageTree = DeepStringRecord<typeof zhCN>;

let enUSCache: MessageTree | null = null;
let enUSLoading: Promise<MessageTree> | null = null;

export type TranslationKey = string;

export function getMessages(locale: LanguagePreference): MessageTree {
  if (locale === "en-US" && enUSCache) return enUSCache;
  return zhCN;
}

export async function loadMessages(locale: LanguagePreference): Promise<MessageTree> {
  if (locale !== "en-US") return zhCN;
  if (enUSCache) return enUSCache;
  enUSLoading ??= import("@/lib/i18n/messages/en-US").then((mod) => {
    enUSCache = mod.default as MessageTree;
    return enUSCache;
  });
  return enUSLoading;
}

export function createTranslator(locale: LanguagePreference, messages?: MessageTree) {
  const tree = messages ?? getMessages(locale);

  return function t(key: TranslationKey, vars?: Record<string, string | number>): string {
    const parts = key.split(".");
    let cur: unknown = tree;
    for (const part of parts) {
      if (cur && typeof cur === "object" && part in cur) {
        cur = (cur as Record<string, unknown>)[part];
      } else {
        return key;
      }
    }
    if (typeof cur !== "string") return key;
    if (!vars) return cur;
    return cur.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`));
  };
}

/** 总结/信息流等服务端 segment 的展示 label */
export function translateSummarySegmentLabel(
  locale: LanguagePreference,
  group: "status" | "type" | "executionLabel",
  key: string,
): string {
  const t = createTranslator(locale);
  return t(`summary.${group}.${key}`);
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyLifePlan",
  description: "个人长期规划与短期计划管理系统",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k="mylifeplan-user-preferences";var r=localStorage.getItem(k);var p=r?JSON.parse(r):null;var t=p&&p.theme?p.theme:"system";var d=document.documentElement;d.classList.remove("light","dark");if(t==="dark"||t==="light"){d.classList.add(t);}else if(window.matchMedia("(prefers-color-scheme: dark)").matches){d.classList.add("dark");}else{d.classList.add("light");}if(p&&p.language){d.lang=p.language;}}catch(e){}})();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

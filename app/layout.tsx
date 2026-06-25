import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meridian Plan",
  description: "Meridian Plan — 让时间看得见 · Make time visible",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k="meridian-user-preferences";var r=localStorage.getItem(k);if(!r){r=localStorage.getItem("mylifeplan-user-preferences");}var p=r?JSON.parse(r):null;var t=p&&p.theme?p.theme:"system";var d=document.documentElement;d.classList.remove("light","dark");if(t==="dark"||t==="light"){d.classList.add(t);}else if(window.matchMedia("(prefers-color-scheme: dark)").matches){d.classList.add("dark");}else{d.classList.add("light");}if(p&&p.language){d.lang=p.language;}}catch(e){}})();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

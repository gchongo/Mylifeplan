"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorMessage, Loading } from "@/components/ui/feedback";
import { useI18n } from "@/components/i18n/i18n-provider";

interface AuditRow {
  id: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId: string | null;
  detail: unknown;
  createdAt: string;
}

export function AdminAuditPageClient() {
  const { t } = useI18n();
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/audit?limit=100")
      .then((res) => res.json())
      .then((data) => {
        if (!data.logs) {
          setError(data.error ?? t("common.loadFailed"));
          return;
        }
        setLogs(data.logs);
      })
      .catch(() => setError(t("common.networkError")))
      .finally(() => setLoading(false));
  }, [t]);

  if (loading) return <Loading />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{t("admin.audit.title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("admin.audit.intro")}</p>
      </div>
      {error && <ErrorMessage message={error} />}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("admin.audit.recent")}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {logs.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-500">{t("admin.audit.empty")}</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("admin.audit.time")}</th>
                  <th className="px-4 py-3 font-medium">{t("admin.audit.admin")}</th>
                  <th className="px-4 py-3 font-medium">{t("admin.audit.action")}</th>
                  <th className="px-4 py-3 font-medium">{t("admin.audit.target")}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 last:border-0 align-top">
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{log.adminEmail}</td>
                    <td className="px-4 py-3 font-mono text-xs">{log.action}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {log.targetType}
                      {log.targetId ? ` · ${log.targetId}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

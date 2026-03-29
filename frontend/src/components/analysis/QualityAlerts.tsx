import React from 'react';
import { useStore } from '../../store';
import type { QualityAlert } from '../../types/analysis';

interface AlertBannerProps {
  alert: QualityAlert;
}

function getSeverityClasses(severity: string): string {
  switch (severity) {
    case 'warning':
      return 'bg-yellow-50 border border-yellow-200 text-yellow-800';
    case 'critical':
      return 'bg-red-50 border border-red-200 text-red-800';
    default:
      // 'info' or any other value
      return 'bg-blue-50 border border-blue-200 text-blue-800';
  }
}

const AlertBanner = React.memo(function AlertBanner({ alert }: AlertBannerProps) {
  const classes = getSeverityClasses(alert.severity);
  return (
    <div className={`rounded-lg px-4 py-3 ${classes}`}>
      <span className="font-medium">{alert.column}</span>
      {': '}
      <span>{alert.message}</span>
    </div>
  );
});

export const QualityAlerts = React.memo(function QualityAlerts() {
  const qualityAlerts = useStore((s) => s.analysisResult?.quality_alerts);

  if (!qualityAlerts || qualityAlerts.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-3 text-gray-800">
        데이터 품질 알림{' '}
        <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-gray-500 rounded-full">
          {qualityAlerts.length}
        </span>
      </h2>
      <div className="flex flex-col gap-2">
        {qualityAlerts.map((alert, index) => (
          <AlertBanner key={`${alert.column}-${alert.alert_type}-${index}`} alert={alert} />
        ))}
      </div>
    </div>
  );
});

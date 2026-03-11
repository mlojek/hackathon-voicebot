import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MetricsWidget } from '../components/MetricsWidget';
import { SessionCard } from '../components/SessionCard';
import { useSessions } from '../hooks/useSessions';
import { useMetrics } from '../hooks/useMetrics';
import { TimeframeSelector, Timeframe } from '../components/TimeframeSelector';
import { LanguageSwitch } from '../components/LanguageSwitch';
import { TimeframeDistributionChart } from '../components/TimeframeDistributionChart';
import { SideMetricsWidget } from '../components/SideMetricsWidget';
import { LanguageProvider, useLanguage } from '../context/LanguageContext';
import { BotMetrics } from '../services/api';

// Bot Comparison Stats Card
function BotComparisonCard({ bot, loading }: { bot: BotMetrics; loading: boolean }) {
  const { translate } = useLanguage();

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{bot.bot_name}</h3>
        {loading && <div className="w-2 h-2 rounded-full bg-white/20 animate-pulse" />}
      </div>

      <div className="space-y-3">
        {/* Total Sessions */}
        <div className="flex justify-between text-sm">
          <span className="text-white/60">{translate('metrics.totalSessions')}</span>
          <span className="font-medium text-white">{bot.total_sessions}</span>
        </div>

        {/* Active Sessions */}
        <div className="flex justify-between text-sm">
          <span className="text-white/60">{translate('metrics.activeSessions')}</span>
          <span className="font-medium text-white">{bot.active_sessions}</span>
        </div>

        {/* Escalation Rate */}
        <div className="flex justify-between text-sm">
          <span className="text-white/60">{translate('metrics.escalationRate')}</span>
          <span className="font-medium text-white">{((bot.escalation_rate || 0) * 100).toFixed(1)}%</span>
        </div>

        {/* Avg Satisfaction */}
        <div className="flex justify-between text-sm">
          <span className="text-white/60">{translate('metrics.avgSatisfaction')}</span>
          <span className="font-medium text-white">{(bot.avg_satisfaction || 0).toFixed(1)}/5.0</span>
        </div>

        {/* Avg Call Duration */}
        <div className="flex justify-between text-sm">
          <span className="text-white/60">{translate('metrics.avgCallDuration')}</span>
          <span className="font-medium text-white">
            {Math.floor((bot.avg_duration || 0) / 60)}m{' '}
            {Math.floor((bot.avg_duration || 0) % 60)}s
          </span>
        </div>

        {/* Completed */}
        <div className="flex justify-between text-sm">
          <span className="text-white/60">{translate('metrics.completed')}</span>
          <span className="font-medium text-white">{bot.completed}</span>
        </div>
      </div>
    </div>
  );
}

function DashboardContent() {
  const { translate } = useLanguage();
  const [timeframe, setTimeframe] = useState<Timeframe>('all');
  const { sessions, loading: sessionsLoading } = useSessions('escalated');
  const { metrics, loading: metricsLoading, lastUpdated } = useMetrics(timeframe);

  // Log metrics updates for debugging
  React.useEffect(() => {
    if (lastUpdated) {
      console.log(`Dashboard metrics updated at: ${lastUpdated.toLocaleTimeString()}`);
    }
  }, [lastUpdated]);

  // We no longer need to show errors - the API will always return data

  if (metricsLoading || sessionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 mx-auto text-white/80 mb-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-white/70">{translate('dashboard.updatingMetrics')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">{translate('dashboard.title')}</h1>
          <p className="text-white/60 mt-1">
            {translate('dashboard.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-6">
          <TimeframeSelector onChange={setTimeframe} defaultValue="all" />
          <LanguageSwitch />

          {lastUpdated && (
            <div className="text-xs text-white/50 flex items-center gap-1">
              <svg className={`w-3 h-3 ${metricsLoading ? 'text-white/60 animate-spin' : 'text-green-400'}`}
                  fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              <span>
                {metricsLoading
                  ? translate('dashboard.updatingMetrics')
                  : `${translate('dashboard.updated')}: ${lastUpdated.toLocaleTimeString()}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Stats Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Metrics - Left Column */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Total Sessions */}
            <MetricsWidget
              title={translate('metrics.totalSessions')}
              value={metrics?.total_sessions || 0}
              color="blue"
              loading={metricsLoading}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              }
            />

            {/* Active Sessions */}
            <MetricsWidget
              title={translate('metrics.activeSessions')}
              value={metrics?.active_sessions || 0}
              color="green"
              loading={metricsLoading}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />

            {/* Escalation Rate */}
            <MetricsWidget
              title={translate('metrics.escalationRate')}
              value={`${((metrics?.escalation_rate || 0) * 100).toFixed(1)}%`}
              color="red"
              loading={metricsLoading}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              }
            />

            {/* Avg Satisfaction */}
            <MetricsWidget
              title={translate('metrics.avgSatisfaction')}
              value={`${(metrics?.avg_satisfaction || 0).toFixed(1)}/5.0`}
              color="purple"
              loading={metricsLoading}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              }
            />

            {/* Avg Call Duration */}
            <MetricsWidget
              title={translate('metrics.avgCallDuration')}
              value={
                `${Math.floor((metrics?.avg_duration || 0) / 60)}m ${Math.floor((metrics?.avg_duration || 0) % 60)}s`
              }
              color="yellow"
              loading={metricsLoading}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />

            {/* Completed */}
            <MetricsWidget
              title={translate('metrics.completed')}
              value={metrics?.completed || 0}
              color="blue"
              loading={metricsLoading}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>

          {/* Distribution Chart */}
          <div className="card">
            <TimeframeDistributionChart
              data={metrics?.timeframe_distribution || {}}
              timeframe={timeframe}
              loading={metricsLoading}
            />
          </div>
        </div>

        {/* Side Metrics - Right Column */}
        <div className="lg:col-span-1">
          <SideMetricsWidget
            firstTryCompletionRate={metrics?.first_try_completion_rate || 0}
            angryCustomersRate={metrics?.angry_customers_rate || 0}
            legalThreatsRate={metrics?.legal_threats_rate || 0}
            loading={metricsLoading}
          />
        </div>
      </div>

      {/* Bot Comparison Stats */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            {translate('comparison.title')}
          </h2>
        </div>

        {metrics?.bots_metrics && metrics.bots_metrics.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.bots_metrics.map(bot => (
              <BotComparisonCard
                key={bot.bot_id}
                bot={bot}
                loading={metricsLoading}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-white/50">
            {translate('comparison.noData')}
          </div>
        )}
      </div>

      {/* Recent Escalations */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            {translate('escalations.title')}
          </h2>
          <Link
            to="/sessions?status=escalated"
            className="text-white/80 hover:text-white font-medium text-sm transition-colors"
          >
            {translate('escalations.viewAll')} →
          </Link>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-12 text-white/60">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-white/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-lg font-medium mb-1 text-white">{translate('escalations.noEscalations')}</p>
            <p className="text-sm">{translate('escalations.runningSmooth')}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <div className="card bg-white/[0.02]">
                <h3 className="text-sm font-medium text-white/60 mb-2">
                  {translate('escalations.total')}
                </h3>
                <p className="text-2xl font-bold text-white">
                  {metrics?.escalated || 0}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {sessions.slice(0, 4).map(session => (
                <SessionCard
                  key={session.session_id || session.id}
                  session={session}
                  onClick={() => {
                    window.location.href = `/sessions/${session.session_id || session.id}`;
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Wrap the dashboard with the language provider
export function Dashboard() {
  return (
    <LanguageProvider>
      <DashboardContent />
    </LanguageProvider>
  );
}

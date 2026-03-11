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
    <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.04] rounded-3xl p-6 hover:bg-white/[0.04] transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white tracking-tight">{bot.bot_name}</h3>
        {loading && <div className="w-2 h-2 rounded-full bg-white/20 animate-pulse" />}
      </div>

      <div className="space-y-4">
        {/* Total Sessions */}
        <div className="flex justify-between items-baseline">
          <span className="text-xs uppercase tracking-wider text-white/40">{translate('metrics.totalSessions')}</span>
          <span className="text-xl font-semibold text-white">{bot.total_sessions}</span>
        </div>

        {/* Active Sessions */}
        <div className="flex justify-between items-baseline">
          <span className="text-xs uppercase tracking-wider text-white/40">{translate('metrics.activeSessions')}</span>
          <span className="text-xl font-semibold text-white">{bot.active_sessions}</span>
        </div>

        {/* Escalation Rate */}
        <div className="flex justify-between items-baseline">
          <span className="text-xs uppercase tracking-wider text-white/40">{translate('metrics.escalationRate')}</span>
          <span className="text-xl font-semibold text-white">{((bot.escalation_rate || 0) * 100).toFixed(1)}%</span>
        </div>

        {/* Avg Satisfaction */}
        <div className="flex justify-between items-baseline">
          <span className="text-xs uppercase tracking-wider text-white/40">{translate('metrics.avgSatisfaction')}</span>
          <span className="text-xl font-semibold text-white">{(bot.avg_satisfaction || 0).toFixed(1)}/5.0</span>
        </div>

        <div className="pt-4 border-t border-white/[0.06] flex justify-between items-baseline">
          <span className="text-xs uppercase tracking-wider text-white/40">{translate('metrics.completed')}</span>
          <span className="text-lg font-medium text-white/80">{bot.completed}</span>
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
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">{translate('dashboard.title')}</h1>
          <p className="text-white/50 text-lg">
            {translate('dashboard.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-6">
          <TimeframeSelector onChange={setTimeframe} defaultValue="all" />
          <LanguageSwitch />

          {lastUpdated && (
            <div className="text-xs text-white/40 flex items-center gap-2">
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

      {/* Main Stats Section - Inspired by Laura Clink CUR8 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Hero Card - Left Column */}
        <div className="lg:col-span-3 space-y-8">
          <div className="card relative overflow-hidden min-h-[560px] flex flex-col">
            {/* Hero Metric */}
            <div className="mb-12">
              <span className="text-[11px] uppercase tracking-widest text-white/40 font-medium mb-3 block">
                {translate('metrics.totalSessions')}
              </span>
              <div className="text-8xl font-bold text-white tracking-tight">
                {metricsLoading ? '...' : (metrics?.total_sessions || 0).toLocaleString()}
              </div>
            </div>

            {/* Distribution Chart - Middle Visual */}
            <div className="flex-1 mb-10">
              <span className="text-[11px] uppercase tracking-widest text-white/40 font-medium mb-6 block">
                {translate('metrics.callDistribution')}
              </span>
              <TimeframeDistributionChart
                data={metrics?.timeframe_distribution || {}}
                timeframe={timeframe}
                loading={metricsLoading}
              />
            </div>

            {/* Bottom Metrics Grid */}
            <div className="grid grid-cols-3 gap-10 pt-8 border-t border-white/[0.06]">
              {/* Active Sessions */}
              <div>
                <span className="text-[11px] uppercase tracking-widest text-white/40 font-medium mb-3 block">
                  {translate('metrics.activeSessions')}
                </span>
                <div className="text-5xl font-bold text-white tracking-tight">
                  {metricsLoading ? '...' : (metrics?.active_sessions || 0).toLocaleString()}
                </div>
              </div>

              {/* Escalation Rate */}
              <div>
                <span className="text-[11px] uppercase tracking-widest text-white/40 font-medium mb-3 block">
                  {translate('metrics.escalationRate')}
                </span>
                <div className="text-5xl font-bold text-white tracking-tight">
                  {metricsLoading ? '...' : `${((metrics?.escalation_rate || 0) * 100).toFixed(2)}%`}
                </div>
              </div>

              {/* Avg Satisfaction */}
              <div>
                <span className="text-[11px] uppercase tracking-widest text-white/40 font-medium mb-3 block">
                  {translate('metrics.avgSatisfaction')}
                </span>
                <div className="text-5xl font-bold text-white tracking-tight">
                  {metricsLoading ? '...' : `${(metrics?.avg_satisfaction || 0).toFixed(1)}/5.0`}
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Metrics Row */}
          <div className="grid grid-cols-3 gap-6">
            <div className="card py-6">
              <div className="text-[11px] uppercase tracking-widest text-white/40 font-medium mb-3">
                {translate('metrics.avgCallDuration')}
              </div>
              <div className="text-3xl font-semibold text-white tracking-tight">
                {metricsLoading ? '...' : `${Math.floor((metrics?.avg_duration || 0) / 60)}m ${Math.floor((metrics?.avg_duration || 0) % 60)}s`}
              </div>
            </div>
            <div className="card py-6">
              <div className="text-[11px] uppercase tracking-widest text-white/40 font-medium mb-3">
                {translate('metrics.completed')}
              </div>
              <div className="text-3xl font-semibold text-white tracking-tight">
                {metricsLoading ? '...' : (metrics?.completed || 0).toLocaleString()}
              </div>
            </div>
            <div className="card py-6">
              <div className="text-[11px] uppercase tracking-widest text-white/40 font-medium mb-3">
                {translate('metrics.escalated')}
              </div>
              <div className="text-3xl font-semibold text-white tracking-tight">
                {metricsLoading ? '...' : (metrics?.escalated || 0).toLocaleString()}
              </div>
            </div>
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
        <h2 className="text-2xl font-semibold text-white mb-8 tracking-tight">
          {translate('comparison.title')}
        </h2>

        {metrics?.bots_metrics && metrics.bots_metrics.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {metrics.bots_metrics.map(bot => (
              <BotComparisonCard
                key={bot.bot_id}
                bot={bot}
                loading={metricsLoading}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-white/40">
            {translate('comparison.noData')}
          </div>
        )}
      </div>

      {/* Recent Escalations */}
      <div className="card">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold text-white tracking-tight">
            {translate('escalations.title')}
          </h2>
          <Link
            to="/sessions?status=escalated"
            className="text-white/60 hover:text-white font-medium text-sm transition-colors uppercase tracking-wider"
          >
            {translate('escalations.viewAll')} →
          </Link>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-16 text-white/60">
            <p className="text-lg font-medium mb-2 text-white">{translate('escalations.noEscalations')}</p>
            <p className="text-sm text-white/40">{translate('escalations.runningSmooth')}</p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="inline-flex bg-white/[0.02] backdrop-blur-xl border border-white/[0.04] rounded-2xl px-6 py-4">
                <span className="text-xs uppercase tracking-widest text-white/40 font-medium mr-4">
                  {translate('escalations.total')}
                </span>
                <span className="text-2xl font-bold text-white">
                  {metrics?.escalated || 0}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

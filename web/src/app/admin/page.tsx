'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { IntegrationHealthPanel } from '@/components/govsync/integration/integration-health-panel';
import { LiveEventStream } from '@/components/govsync/integration/live-event-stream';
import { IntegrationDebug } from '@/components/govsync/integration/integration-debug';
import { FailureSimulator } from '@/components/govsync/integration/failure-simulator';
import { SectionHeading } from '@/components/govsync/page-header';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, RefreshCw, PlugZap, TriangleAlert, MousePointer, SquareDot } from 'lucide-react';

// Simple types for demo
interface HealthData {
  health: { id: string }[];
  integrationMetrics: {
    totalRequests: number;
    failed: number;
  };
}

interface IntegrationEvent {
  id: string;
}

interface WorkflowSummary {
  id: string;
}

export default function AdminPage() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [events, setEvents] = useState<IntegrationEvent[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  // Fetch department health
  async function fetchHealthData() {
    try {
      const res = await fetch('/api/govsync/health');
      const data = await res.json();
      setHealthData(data);
    } catch (err) {
      console.error('Failed to fetch health', err);
    }
  }

  // Fetch integration events
  async function fetchIntegrationEvents() {
    try {
      const res = await fetch('/api/govsync/integration/events');
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.error('Failed to fetch events', err);
    }
  }

  // Fetch active workflows (simplified: from applications or workflow store)
  async function fetchActiveWorkflows() {
    try {
      // Use existing applications data as proxy for active workflows
      const res = await fetch('/api/govsync/applications');
      const data = await res.json();
      // Filter to active/in progress applications
      const active = data.filter((app: any) => app.status !== 'COMPLETED' && app.status !== 'REJECTED');
      setWorkflows(active.slice(0, 5)); // Show top 5
    } catch (err) {
      console.error('Failed to fetch workflows', err);
    }
  }

  useEffect(() => {
    fetchHealthData();
    fetchIntegrationEvents();
    fetchActiveWorkflows();
  }, []);

  const handleSyncAll = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      // Get first active workflow ID to sync (or we could sync all)
      const workflowId = workflows[0]?.id;
      if (!workflowId) {
        setSyncResult('No active workflows to sync');
        return;
      }
      const res = await fetch(`/api/govsync/workflow/${workflowId}/sync`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sync failed');
      setSyncResult('Sync completed successfully');
      // Refetch data to reflect updates
      setTimeout(() => {
        fetchHealthData();
        fetchIntegrationEvents();
        fetchActiveWorkflows();
      }, 1000);
    } catch (err: any) {
      setSyncResult(`Sync failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSimulateFailure = async (dept: string) => {
    try {
      const res = await fetch('/api/govsync/integration/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department: dept, action: 'simulate' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to simulate');
      // Refetch to show updated health
      setTimeout(fetchHealthData, 500);
    } catch (err: any) {
      alert(`Failed to simulate failure: ${err.message}`);
    }
  };

  const handleRestore = async (dept: string) => {
    try {
      const res = await fetch('/api/govsync/integration/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department: dept, action: 'restore' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to restore');
      setTimeout(fetchHealthData, 500);
    } catch (err: any) {
      alert(`Failed to restore department: ${err.message}`);
    }
  };

  if (!healthData) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold mb-4">GovSync Integration Center</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Monitor and operate connected department systems
          <span className="ml-2 px-2 py-0.5 text-xs bg-muted/20 rounded">SIMULATION MODE</span>
        </p>
        <p className="text-xs text-muted">Loading integration health data...</p>
      </main>
    );
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">GovSync Integration Center</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Monitor and operate connected department systems
        <span className="ml-2 px-2 py-0.5 text-xs bg-muted/20 rounded">SIMULATION MODE</span>
      </p>

      {/* Summary Cards */}
      <div className="grid gap-4 mb-6 md:grid-cols-2">
        <div className="card border rounded-lg p-4">
          <h2 className="font-semibold mb-2">Connected Departments</h2>
          <p className="text-2xl font-bold">{healthData?.health?.length || 4}</p>
          <p className="text-sm text-muted-foreground">
            Revenue • Pollution Control • Fire • Labour
          </p>
        </div>
        <div className="card border rounded-lg p-4">
          <h2 className="font-semibold mb-2">Active Workflows</h2>
          <p className="text-2xl font-bold">{workflows.length}</p>
        </div>
        <div className="card border rounded-lg p-4">
          <h2 className="font-semibold mb-2">API Requests (Session)</h2>
          <p className="text-2xl font-bold">
            {healthData?.integrationMetrics?.totalRequests || 0}
          </p>
        </div>
        <div className="card border rounded-lg p-4">
          <h2 className="font-semibold mb-2">Failed Requests</h2>
          <p className="text-2xl font-bold text-destructive">
            {healthData?.integrationMetrics?.failed || 0}
          </p>
        </div>
      </div>

      {/* Integration Health */}
      <section className="mb-6">
        <IntegrationHealthPanel />
      </section>

      {/* Live Event Stream */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Live Event Stream</h2>
        <div className="card border rounded-lg p-4">
          <LiveEventStream />
        </div>
      </section>

      {/* Demo Controls */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Demo Operations</h2>
        <div className="card border rounded-lg p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <Button
              onClick={handleSyncAll}
              disabled={isSyncing}
              className="flex-1 sm:auto px-4 py-2"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <PlugZap className="mr-2 h-4 w-4" />
                  Sync All Departments
                </>
              )}
            </Button>
            {syncResult && (
              <span className="px-3 py-1 text-xs rounded">
                {syncResult.includes('success') ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}
                {syncResult}
              </span>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            {[ 'Revenue', 'Pollution Control', 'Fire', 'Labour' ].map((dept) => (
              <div key={dept} className="flex flex-col items-center">
                <Button
                  variant="outline"
                  onClick={() => handleSimulateFailure(dept.toLowerCase().replace(' ', ''))}
                  className="w-full mb-2"
                >
                  <TriangleAlert className="mr-2 h-4 w-4" /> Simulate
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRestore(dept.toLowerCase().replace(' ', ''))}
                  className="w-full"
                >
                  <SquareDot className="mr-2 h-4 w-4" /> Restore
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Integration Activity */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Recent Integration Activity</h2>
        <div className="card border rounded-lg p-4">
          <IntegrationDebug />
        </div>
      </section>

      {/* Failure Simulator */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Failure Simulator</h2>
        <div className="card border rounded-lg p-4">
          <FailureSimulator />
        </div>
      </section>
    </main>
  );
}
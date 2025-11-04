import { useState, useEffect, useMemo } from 'react';
import { fetchEndpoints, fetchEndpointsTotalCount } from '../api';
import { fetchDatabasesPage } from '@/features/databases/api';
import type { Endpoint } from '../types';
import type { Database } from '@/features/databases/types';
import { EndpointTable } from '../components/EndpointTable';

const PAGE_SIZE = 10;

export function EndpointsTable({ appId }: { appId: string }) {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [databases, setDatabases] = useState<Database[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!appId) return;
    loadData();
  }, [appId, offset]);
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [epsRes, totalRes, dbsRes] = await Promise.all([
        fetchEndpoints(appId, PAGE_SIZE, offset),
        fetchEndpointsTotalCount(appId),
        fetchDatabasesPage(appId, { limit: 1000, offset: 0 }),
      ]);
      setEndpoints(epsRes.data.endpoints.nodes);
      setTotalCount(totalRes.data.endpoints.totalCount);
      setDatabases(dbsRes.data.databases.nodes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load endpoints');
    } finally {
      setLoading(false);
    }
  };
  const dbNameById = useMemo(() => {
    const m = new Map<string, string>();
    databases.forEach(d => m.set(d.id, d.name));
    return m;
  }, [databases]);
  if (loading && endpoints.length === 0) {
    return <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-4 min-h-[5rem]">Loading...</div>;
  }
  if (error) {
    return <div className="text-red-500 mt-4">{error}</div>;
  }
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-0">
      <EndpointTable endpoints={endpoints} dbNameById={dbNameById} />
    </div>
  );
}

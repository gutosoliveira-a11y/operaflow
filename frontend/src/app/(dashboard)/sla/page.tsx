'use client';

import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useSlaConfig, useUpsertSlaConfig } from '@/hooks/use-sla-config';
import { useSectors } from '@/hooks/use-sectors';
import type { Priority } from '@/types';

const PRIORITIES: Priority[] = ['baixa', 'media', 'alta', 'critica'];
const priorityLabel: Record<Priority, string> = {
  baixa: 'Baixa', media: 'Média', alta: 'Alta', critica: 'Crítica',
};
const priorityColor: Record<Priority, string> = {
  baixa: 'text-text-secondary', media: 'text-info', alta: 'text-warning', critica: 'text-danger',
};

type CellKey = `${string}_${string}`;

export default function SlaPage() {
  const { data: configs = [], isLoading: loadingConfigs } = useSlaConfig();
  const { data: sectors = [], isLoading: loadingSectors } = useSectors();
  const upsert = useUpsertSlaConfig();

  const [localValues, setLocalValues] = useState<Record<CellKey, string>>({});
  const [original, setOriginal] = useState<Record<CellKey, number>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const orig: Record<CellKey, number> = {};
    const vals: Record<CellKey, string> = {};
    for (const c of configs) {
      const key = `${c.sectorId}_${c.priority}` as CellKey;
      orig[key] = c.hoursLimit;
      vals[key] = c.hoursLimit.toString();
    }
    setOriginal(orig);
    setLocalValues(vals);
  }, [configs]);

  function getKey(sectorId: string, priority: string): CellKey {
    return `${sectorId}_${priority}` as CellKey;
  }

  function getValue(sectorId: string, priority: string): string {
    const key = getKey(sectorId, priority);
    return localValues[key] ?? original[key]?.toString() ?? '';
  }

  function isDirty(sectorId: string, priority: string): boolean {
    const key = getKey(sectorId, priority);
    const orig = original[key];
    const cur = Number(localValues[key]);
    return orig !== undefined && !isNaN(cur) && cur !== orig && cur > 0;
  }

  async function handleSave() {
    const dirty: { sectorId: string; priority: string; hoursLimit: number }[] = [];
    for (const sector of sectors) {
      for (const priority of PRIORITIES) {
        if (isDirty(sector.id, priority)) {
          const key = getKey(sector.id, priority);
          dirty.push({ sectorId: sector.id, priority, hoursLimit: Number(localValues[key]) });
        }
      }
    }
    if (dirty.length === 0) return;
    setSaving(true);
    try {
      await Promise.all(dirty.map(d => upsert.mutateAsync(d)));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  const hasDirty = sectors.some(s => PRIORITIES.some(p => isDirty(s.id, p)));

  if (loadingConfigs || loadingSectors) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin-slow" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Configuração SLA</h1>
          <p className="text-text-secondary text-sm mt-0.5">Horas limite por setor e prioridade</p>
        </div>
        <button
          onClick={handleSave}
          disabled={!hasDirty || saving}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar configurações'}
        </button>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-text-secondary font-medium text-xs uppercase tracking-wider w-40">Setor</th>
              {PRIORITIES.map(p => (
                <th key={p} className={`px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider ${priorityColor[p]}`}>
                  {priorityLabel[p]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sectors.map((sector, i) => (
              <tr key={sector.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-background/30'}`}>
                <td className="px-4 py-3 text-text-primary font-medium">{sector.name}</td>
                {PRIORITIES.map(priority => {
                  const dirty = isDirty(sector.id, priority);
                  return (
                    <td key={priority} className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          min="1"
                          value={getValue(sector.id, priority)}
                          onChange={e => setLocalValues(v => ({ ...v, [getKey(sector.id, priority)]: e.target.value }))}
                          className={`w-16 px-2 py-1.5 text-center bg-background border rounded text-sm text-text-primary focus:outline-none focus:border-accent/50 tabular-nums transition-colors ${dirty ? 'border-accent/60' : 'border-border'}`}
                        />
                        <span className="text-text-muted text-xs">h</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
            {sectors.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-text-muted">Nenhum setor encontrado</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {hasDirty && (
        <p className="text-accent text-xs animate-fade-in">Há alterações não salvas — clique em &quot;Salvar configurações&quot;</p>
      )}
    </div>
  );
}

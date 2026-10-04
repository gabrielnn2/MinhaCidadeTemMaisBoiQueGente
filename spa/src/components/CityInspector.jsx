import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ArrowLeft, MapPin } from 'lucide-react';

export default function CityInspector({
  selectedCity,
  onResetCity,
  nationalSummary,
  anos,
  cityHistory,
  regFilter,
  ufFilter
}) {
  const isBrasil = !selectedCity;

  // Preparar dados do gráfico municipal
  let chartData = [];
  if (!isBrasil && cityHistory && cityHistory[selectedCity.id]) {
    const hist = cityHistory[selectedCity.id];
    chartData = anos
      .map((ano, idx) => ({
        ano,
        bois: hist.b[idx] || 0,
        pessoas: hist.p[idx] || 0
      }))
      .filter(item => item.ano <= 2025);
  }

  const formatNumber = (val) => Number(val || 0).toLocaleString('pt-BR');

  return (
    <div className="inspector-panel">
      {isBrasil ? (
        // ==========================================
        // CASO 1: AGREGADO ESPECIAL DO BRASIL / RECORTE
        // ==========================================
        <div className="card-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', fontFamily: 'var(--font-display)' }}>
                {ufFilter && ufFilter !== 'Todas as UFs'
                  ? `Recorte: ${ufFilter}`
                  : regFilter && regFilter !== 'Todas as Regiões'
                  ? `Recorte: ${regFilter}`
                  : '🇧🇷 Agregado Especial: Brasil Consolidado'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                Cobertura: {formatNumber(nationalSummary.totalMun)} municípios • Ano 2025
              </div>
            </div>
          </div>

          <div style={{ marginTop: '10px', marginBottom: '16px' }}>
            <span className={`badge-status ${nationalSummary.saldo >= 0 ? 'badge-boi' : 'badge-gente'}`}>
              {(ufFilter && ufFilter !== 'Todas as UFs') || (regFilter && regFilter !== 'Todas as Regiões')
                ? nationalSummary.saldo >= 0 ? '🐂 ESTE RECORTE TEM MAIS BOI QUE GENTE' : '👥 ESTE RECORTE TEM MAIS GENTE QUE BOI'
                : '🐂 O BRASIL TEM MAIS BOI QUE GENTE'}
            </span>
          </div>

          <div className="metric-mini-grid">
            <div className="metric-mini">
              <div className="metric-mini-label">Total de Bois</div>
              <div className="metric-mini-val" style={{ color: 'var(--color-amber)' }}>
                {formatNumber(nationalSummary.totalBov)}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', marginTop: '2px' }}>bois</div>
            </div>

            <div className="metric-mini">
              <div className="metric-mini-label">Total de Pessoas</div>
              <div className="metric-mini-val" style={{ color: 'var(--color-emerald)' }}>
                {formatNumber(nationalSummary.totalPop)}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', marginTop: '2px' }}>pessoas</div>
            </div>

            <div className="metric-mini">
              <div className="metric-mini-label">Razão</div>
              <div className="metric-mini-val" style={{ color: nationalSummary.saldo >= 0 ? 'var(--color-amber)' : 'var(--color-emerald)' }}>
                {nationalSummary.razao.toFixed(2).replace('.', ',')}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', marginTop: '2px' }}>bois por pessoa</div>
            </div>

            <div className="metric-mini">
              <div className="metric-mini-label">Diferença</div>
              <div className="metric-mini-val" style={{ color: nationalSummary.saldo >= 0 ? 'var(--color-amber)' : 'var(--color-emerald)' }}>
                {formatNumber(Math.abs(nationalSummary.saldo))}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
                {nationalSummary.saldo >= 0 ? 'bois a mais que pessoas' : 'pessoas a mais que bois'}
              </div>
            </div>

            <div className="metric-mini">
              <div className="metric-mini-label">Mais Boi que Gente</div>
              <div className="metric-mini-val" style={{ color: 'var(--color-amber)' }}>
                {nationalSummary.pctMaisBoi.toFixed(1).replace('.', ',')}%
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
                {formatNumber(nationalSummary.cidadesMaisBoi)} municípios
              </div>
            </div>

            <div className="metric-mini">
              <div className="metric-mini-label">Mais Gente que Boi</div>
              <div className="metric-mini-val" style={{ color: 'var(--color-emerald)' }}>
                {nationalSummary.pctMaisGente.toFixed(1).replace('.', ',')}%
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
                {formatNumber(nationalSummary.cidadesMaisGente)} municípios
              </div>
            </div>
          </div>
        </div>
      ) : (
        // ==========================================
        // CASO 2: CIDADE ESPECÍFICA SELECIONADA
        // ==========================================
        <div className="card-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', fontFamily: 'var(--font-display)' }}>
                <MapPin size={18} color="var(--color-amber)" />
                {selectedCity.name} - {selectedCity.uf}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                Região {selectedCity.reg} • Código IBGE: {selectedCity.id}
              </div>
            </div>

            <button className="btn-primary" onClick={onResetCity} title="Restaurar visão nacional">
              <ArrowLeft size={14} /> Brasil
            </button>
          </div>

          <div style={{ marginTop: '10px', marginBottom: '16px' }}>
            <span className={`badge-status ${selectedCity.mais_boi === 1 ? 'badge-boi' : 'badge-gente'}`}>
              {selectedCity.mais_boi === 1
                ? '🐂 Esta cidade tem MAIS BOI QUE GENTE'
                : '👥 Esta cidade tem MAIS GENTE QUE BOI'}
            </span>
          </div>

          <div className="metric-mini-grid">
            <div className="metric-mini">
              <div className="metric-mini-label">Total de Bois</div>
              <div className="metric-mini-val" style={{ color: 'var(--color-amber)' }}>
                {formatNumber(selectedCity.bov)}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', marginTop: '2px' }}>bois na cidade</div>
            </div>

            <div className="metric-mini">
              <div className="metric-mini-label">Total de Pessoas</div>
              <div className="metric-mini-val" style={{ color: 'var(--color-emerald)' }}>
                {formatNumber(selectedCity.pop)}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', marginTop: '2px' }}>pessoas na cidade</div>
            </div>

            <div className="metric-mini">
              <div className="metric-mini-label">Razão Boi/Pessoa</div>
              <div className="metric-mini-val" style={{ color: selectedCity.mais_boi === 1 ? 'var(--color-amber)' : 'var(--color-emerald)' }}>
                {selectedCity.razao.toFixed(2).replace('.', ',')}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', marginTop: '2px' }}>bois por pessoa</div>
            </div>

            <div className="metric-mini">
              <div className="metric-mini-label">Diferença</div>
              <div className="metric-mini-val" style={{ color: selectedCity.bov >= selectedCity.pop ? 'var(--color-amber)' : 'var(--color-emerald)' }}>
                {formatNumber(Math.abs(selectedCity.bov - selectedCity.pop))}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
                {selectedCity.bov >= selectedCity.pop ? 'bois a mais que pessoas' : 'pessoas a mais que bois'}
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '8px' }}>
            Evolução Histórica de {selectedCity.name} (2000 a 2025)
          </div>

          <div style={{ height: '200px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="ano" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis domain={['auto', 'auto']} width={48} stroke="#64748B" fontSize={11} tickFormatter={(v) => formatNumber(v)} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '12px' }}
                  formatter={(value, name) => [formatNumber(value), name === 'bois' ? 'Bois' : 'Pessoas']}
                  labelFormatter={(l) => `Ano: ${l}`}
                />
                <Line type="monotone" dataKey="bois" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 2 }} name="bois" />
                <Line type="monotone" dataKey="pessoas" stroke="#10B981" strokeWidth={2.5} dot={{ r: 2 }} name="pessoas" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

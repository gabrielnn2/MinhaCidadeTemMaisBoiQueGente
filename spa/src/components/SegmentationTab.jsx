import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, LabelList, Cell } from 'recharts';

const UF_NAMES = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia',
  CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás',
  MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais',
  PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí',
  RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul',
  RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo',
  SE: 'Sergipe', TO: 'Tocantins'
};

export default function SegmentationTab({ municipios }) {
  const formatNumber = (val) => Number(val || 0).toLocaleString('pt-BR');
  const formatMillions = (val) => `${(val / 1000000).toFixed(1).replace('.', ',')}M`;

  // 1. Agregação Regional
  const regMap = {};
  municipios.forEach(m => {
    if (!regMap[m.reg]) {
      regMap[m.reg] = { reg: m.reg, bov: 0, pop: 0, cidades: 0, cidades_boi: 0 };
    }
    regMap[m.reg].bov += m.bov;
    regMap[m.reg].pop += m.pop;
    regMap[m.reg].cidades += 1;
    if (m.mais_boi === 1) regMap[m.reg].cidades_boi += 1;
  });

  const regData = Object.values(regMap).map(r => ({
    reg: r.reg,
    bov: r.bov,
    pop: r.pop,
    cidades: r.cidades,
    cidades_boi: r.cidades_boi,
    pct_boi: Number(((r.cidades_boi / r.cidades) * 100).toFixed(1)),
    razao: Number((r.bov / r.pop).toFixed(2))
  })).sort((a, b) => b.pct_boi - a.pct_boi);

  // 2. Agregação por UF
  const ufMap = {};
  municipios.forEach(m => {
    if (!ufMap[m.uf]) {
      ufMap[m.uf] = {
        uf: m.uf,
        uf_nome: m.uf_nome || UF_NAMES[m.uf] || m.uf,
        reg: m.reg,
        bov: 0,
        pop: 0,
        cidades: 0,
        cidades_boi: 0
      };
    }
    ufMap[m.uf].bov += m.bov;
    ufMap[m.uf].pop += m.pop;
    ufMap[m.uf].cidades += 1;
    if (m.mais_boi === 1) ufMap[m.uf].cidades_boi += 1;
  });

  const ufData = Object.values(ufMap).map(u => ({
    uf: u.uf,
    uf_nome: u.uf_nome,
    reg: u.reg,
    bov: u.bov,
    pop: u.pop,
    razao: Number((u.bov / u.pop).toFixed(2)),
    pct_boi: Number(((u.cidades_boi / u.cidades) * 100).toFixed(1))
  })).sort((a, b) => b.razao - a.razao);

  // 3. Top 10 Maiores Rebanhos de Bois
  const topBov = [...municipios].sort((a, b) => b.bov - a.bov).slice(0, 10);

  // 4. Top 10 Cidades com Maior Razão Boi por Pessoa (mínimo 1000 pessoas)
  const topRazao = [...municipios].filter(m => m.pop >= 1000).sort((a, b) => b.razao - a.razao).slice(0, 10);

  // Custom Tooltip para o comparativo regional de volumes
  const CustomRegionTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      const temMaisBoi = d.bov > d.pop;
      const corRazao = temMaisBoi ? '#F59E0B' : '#10B981';
      return (
        <div className="custom-map-tooltip" style={{ minWidth: '180px' }}>
          <div className="tooltip-header">Região {d.reg}</div>
          <div className={`tooltip-badge ${temMaisBoi ? 'badge-boi' : 'badge-gente'}`} style={{ marginBottom: '8px' }}>
            {temMaisBoi ? '🐂 Mais Boi que Gente' : '👥 Mais Gente que Boi'}
          </div>
          <div className="tooltip-row">
            <span>Bois:</span>
            <strong style={{ color: '#F59E0B' }}>{formatNumber(d.bov)}</strong>
          </div>
          <div className="tooltip-row">
            <span>Pessoas:</span>
            <strong style={{ color: '#10B981' }}>{formatNumber(d.pop)}</strong>
          </div>
          <div className="tooltip-footer">
            Razão: <strong style={{ color: corRazao }}>{d.razao.toFixed(2).replace('.', ',')}</strong> bois por pessoa
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip para o ranking estadual
  const CustomUfTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      const temMaisBoi = d.razao > 1;
      const corRazao = temMaisBoi ? '#F59E0B' : '#10B981';
      return (
        <div className="custom-map-tooltip" style={{ minWidth: '180px' }}>
          <div className="tooltip-header">{d.uf_nome} ({d.uf})</div>
          <div className={`tooltip-badge ${temMaisBoi ? 'badge-boi' : 'badge-gente'}`} style={{ marginBottom: '8px' }}>
            {temMaisBoi ? '🐂 Mais Boi que Gente' : '👥 Mais Gente que Boi'}
          </div>
          <div className="tooltip-row">
            <span>Bois:</span>
            <strong style={{ color: '#F59E0B' }}>{formatNumber(d.bov)}</strong>
          </div>
          <div className="tooltip-row">
            <span>Pessoas:</span>
            <strong style={{ color: '#10B981' }}>{formatNumber(d.pop)}</strong>
          </div>
          <div className="tooltip-footer">
            Razão: <strong style={{ color: corRazao }}>{d.razao.toFixed(2).replace('.', ',')}</strong> bois por pessoa
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Label com cores correspondentes à categoria no ranking estadual
  const renderCustomUfLabel = (props) => {
    const { x, y, width, value } = props;
    if (value === undefined || value === null) return null;
    const num = Number(value);
    const cor = num > 1 ? '#F59E0B' : '#10B981';
    return (
      <text
        x={x + width / 2}
        y={y - 4}
        fill={cor}
        textAnchor="middle"
        fontSize={9}
        fontWeight={600}
      >
        {num.toFixed(2).replace('.', ',')}
      </text>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Panorama Regional */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card-box">
          <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>
            % dos Municípios com Mais Boi que Gente por Região
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginBottom: '14px' }}>
            Percentual de cidades onde o rebanho de bois supera a contagem de pessoas
          </div>
          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regData} layout="vertical" margin={{ top: 5, right: 45, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis type="number" domain={[0, 100]} stroke="#64748B" fontSize={11} tickFormatter={(v) => `${v}%`} />
                <YAxis dataKey="reg" type="category" stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '12px' }}
                  formatter={(val) => [`${Number(val).toFixed(1).replace('.', ',')}%`, '% Cidades com Mais Boi que Gente']}
                />
                <Bar dataKey="pct_boi" name="% Cidades com Mais Boi que Gente" fill="#F59E0B" radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="pct_boi" position="right" formatter={(val) => `${Number(val).toFixed(1).replace('.', ',')}%`} fill="#F59E0B" fontSize={11} fontWeight={600} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-box">
          <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>
            Bois vs Pessoas por Região
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginBottom: '14px' }}>
            Total absoluto de bois e pessoas em cada Grande Região (em milhões)
          </div>
          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regData} margin={{ top: 22, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="reg" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} tickLine={false} />
                <Tooltip content={<CustomRegionTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '8px' }} />
                <Bar dataKey="bov" name="Bois" fill="#F59E0B" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="bov" position="top" formatter={formatMillions} fill="#F59E0B" fontSize={10} />
                </Bar>
                <Bar dataKey="pop" name="Pessoas" fill="#10B981" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="pop" position="top" formatter={formatMillions} fill="#10B981" fontSize={10} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Ranking Estadual */}
      <div className="card-box">
        <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>
          Ranking Estadual por Densidade: Bois por Pessoa por UF
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginBottom: '14px' }}>
          Proporção média de bois para cada pessoa no estado (Laranja: Mais Boi que Gente | Verde: Mais Gente que Boi)
        </div>
        <div style={{ height: '320px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ufData} margin={{ top: 22, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="uf" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis hide={true} />
              <Tooltip content={<CustomUfTooltip />} />
              <Bar dataKey="razao" name="Bois por Pessoa" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="razao" position="top" content={renderCustomUfLabel} />
                {ufData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.razao > 1 ? '#F59E0B' : '#10B981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabelas Top 10 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card-box">
          <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '12px' }}>
            Top 10 Cidades com Mais Bois no Brasil
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Município</th>
                <th>UF</th>
                <th style={{ textAlign: 'right' }}>Bois</th>
                <th style={{ textAlign: 'right' }}>Pessoas</th>
                <th style={{ textAlign: 'right' }}>Razão</th>
              </tr>
            </thead>
            <tbody>
              {topBov.map(m => (
                <tr key={m.id}>
                  <td><strong>{m.name}</strong></td>
                  <td>{m.uf}</td>
                  <td style={{ textAlign: 'right', color: 'var(--color-amber)', fontWeight: '600' }}>{formatNumber(m.bov)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--color-emerald)' }}>{formatNumber(m.pop)}</td>
                  <td style={{ textAlign: 'right', color: m.razao > 1 ? 'var(--color-amber)' : 'var(--color-emerald)', fontWeight: '600' }}>
                    {m.razao.toFixed(2).replace('.', ',')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card-box">
          <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '12px' }}>
            Top 10 Cidades com Maior Razão Boi por Pessoa
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Município</th>
                <th>UF</th>
                <th style={{ textAlign: 'right' }}>Bois</th>
                <th style={{ textAlign: 'right' }}>Pessoas</th>
                <th style={{ textAlign: 'right' }}>Razão</th>
              </tr>
            </thead>
            <tbody>
              {topRazao.map(m => (
                <tr key={m.id}>
                  <td><strong>{m.name}</strong></td>
                  <td>{m.uf}</td>
                  <td style={{ textAlign: 'right', color: 'var(--color-amber)', fontWeight: '600' }}>{formatNumber(m.bov)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--color-emerald)' }}>{formatNumber(m.pop)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--color-amber)', fontWeight: '700' }}>
                    {m.razao.toFixed(2).replace('.', ',')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

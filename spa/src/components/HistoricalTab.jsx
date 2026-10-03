import React from 'react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export default function HistoricalTab({ nationalHistory }) {
  const formatNumber = (val) => Number(val || 0).toLocaleString('pt-BR');

  // Calcular Base 100
  const base2000 = nationalHistory[0] || { bov: 1, pop: 1 };
  const chartData = nationalHistory.map(item => ({
    ano: item.ANO,
    bois: item.bov,
    pessoas: item.pop,
    cidades_mais_boi: item.mun_boi,
    cidades_mais_pessoas: item.total_mun - item.mun_boi,
    bois_base100: Number(((item.bov / base2000.bov) * 100).toFixed(1)),
    pessoas_base100: Number(((item.pop / base2000.pop) * 100).toFixed(1))
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Gráfico 1: Volumes Absolutos */}
        <div className="card-box">
          <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>
            1. Trajetória Absoluta: Total de Bois vs Pessoas
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginBottom: '14px' }}>
            Volume nacional total apurado de 2000 a 2026
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="ano" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '12px' }}
                  formatter={(val, name) => [formatNumber(val), name === 'bois' ? 'Bois' : 'Pessoas']}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                <Line type="monotone" dataKey="bois" name="Bois" stroke="#F59E0B" strokeWidth={3} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="pessoas" name="Pessoas" stroke="#10B981" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Velocidade de Crescimento Base 100 */}
        <div className="card-box">
          <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>
            2. Velocidade de Crescimento (Base 100 = Ano 2000)
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginBottom: '14px' }}>
            Comparativo de evolução proporcional acumulada
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="ano" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={12} domain={['auto', 'auto']} tickFormatter={(v) => `${v}%`} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '12px' }}
                  formatter={(val, name) => [`${val}%`, name === 'bois_base100' ? 'Crescimento de Bois' : 'Crescimento de Pessoas']}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                <Line type="monotone" dataKey="bois_base100" name="Crescimento de Bois" stroke="#F59E0B" strokeWidth={2.8} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="pessoas_base100" name="Crescimento de Pessoas" stroke="#10B981" strokeWidth={2.8} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Gráfico 3: Divisão das Cidades */}
      <div className="card-box">
        <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>
          3. Divisão dos Municípios Brasileiros: Mais Boi que Gente vs Mais Gente que Boi
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginBottom: '14px' }}>
          Evolução anual da quantidade de cidades onde predominam bois ou pessoas
        </div>
        <div style={{ height: '280px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="ano" stroke="#64748B" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '12px' }}
                formatter={(val, name) => [formatNumber(val), name === 'cidades_mais_boi' ? 'Cidades c/ Mais Boi que Gente' : 'Cidades c/ Mais Gente que Boi']}
              />
              <Legend iconType="rect" wrapperStyle={{ paddingTop: '10px' }} />
              <Bar dataKey="cidades_mais_boi" name="Cidades c/ Mais Boi que Gente" stackId="a" fill="#F59E0B" />
              <Bar dataKey="cidades_mais_pessoas" name="Cidades c/ Mais Gente que Boi" stackId="a" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Download, Search } from 'lucide-react';

export default function DataTableTab({ municipios }) {
  const [searchTerm, setSearchTerm] = useState('');
  const formatNumber = (val) => Number(val || 0).toLocaleString('pt-BR');

  const filtered = municipios.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.uf.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(m.id).includes(searchTerm)
  );

  const downloadCSV = () => {
    const headers = ['Cod_IBGE;Municipio;UF;Regiao;Total_Bois;Total_Pessoas;Razao_Boi_Pessoa;Diferenca;Diagnostico'];
    const rows = filtered.map(m => {
      const saldo = m.bov - m.pop;
      const diag = m.mais_boi === 1 ? 'Mais Boi que Gente' : 'Mais Gente que Boi';
      return `${m.id};"${m.name}";${m.uf};"${m.reg}";${m.bov};${m.pop};${m.razao.toFixed(2).replace('.', ',')};${saldo};"${diag}"`;
    });

    const csvContent = '\uFEFF' + [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `minha_cidade_tem_mais_boi_que_gente.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="card-box">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={16} color="var(--text-subtle)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por município ou UF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>

        <button className="btn-primary" onClick={downloadCSV}>
          <Download size={15} /> Exportar CSV ({filtered.length} cidades)
        </button>
      </div>

      <div style={{ maxHeight: '550px', overflowY: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Cód. IBGE</th>
              <th>Município</th>
              <th>UF</th>
              <th>Região</th>
              <th style={{ textAlign: 'right' }}>Total de Bois</th>
              <th style={{ textAlign: 'right' }}>Total de Pessoas</th>
              <th style={{ textAlign: 'right' }}>Razão (Bois/Pessoa)</th>
              <th style={{ textAlign: 'right' }}>Diferença</th>
              <th>Diagnóstico</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 200).map(m => {
              const saldo = m.bov - m.pop;
              const temMaisBoi = m.mais_boi === 1;
              return (
                <tr key={m.id}>
                  <td style={{ color: 'var(--text-subtle)' }}>{m.id}</td>
                  <td><strong>{m.name}</strong></td>
                  <td>{m.uf}</td>
                  <td>{m.reg}</td>
                  <td style={{ textAlign: 'right', color: 'var(--color-amber)', fontWeight: '600' }}>
                    {formatNumber(m.bov)}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--color-emerald)', fontWeight: '600' }}>
                    {formatNumber(m.pop)}
                  </td>
                  <td style={{ textAlign: 'right' }}>{m.razao.toFixed(2).replace('.', ',')}</td>
                  <td style={{ textAlign: 'right', color: saldo >= 0 ? 'var(--color-amber)' : 'var(--color-emerald)' }}>
                    {saldo > 0 ? '+' : ''}{formatNumber(saldo)}
                  </td>
                  <td>
                    <span className={`badge-status ${temMaisBoi ? 'badge-boi' : 'badge-gente'}`} style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
                      {temMaisBoi ? '🐂 Mais Boi que Gente' : '👥 Mais Gente que Boi'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {filtered.length > 200 && (
        <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginTop: '10px', textAlign: 'center' }}>
          Exibindo os primeiros 200 resultados de {formatNumber(filtered.length)}. Baixe o CSV para a lista completa.
        </div>
      )}
    </div>
  );
}

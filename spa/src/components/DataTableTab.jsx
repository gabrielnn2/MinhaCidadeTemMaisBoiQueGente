import React, { useState, useMemo } from 'react';
import { Download, Search, ArrowUpDown, ChevronDown, ChevronUp, Info } from 'lucide-react';

const UF_FULL_NAMES = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia',
  CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás',
  MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais',
  PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí',
  RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul',
  RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo',
  SE: 'Sergipe', TO: 'Tocantins'
};

// Função para normalizar texto (remove acentos, pontuação e converte para minúsculas)
function normalizeText(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export default function DataTableTab({ municipios, allMunicipios }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('bov'); // 'id' | 'name' | 'uf' | 'reg' | 'bov' | 'pop' | 'razao' | 'saldo' | 'mais_boi'
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'
  const [pageSize, setPageSize] = useState(200); // 100 | 200 | 500 | 'all'
  const [currentPage, setCurrentPage] = useState(1);

  const formatNumber = (val) => Number(val || 0).toLocaleString('pt-BR');

  // Base para busca: pesquisa na base nacional completa de 5.570 municípios se houver busca digitada
  const sourceList = useMemo(() => {
    if (searchTerm.trim() && allMunicipios && allMunicipios.length > 0) {
      return allMunicipios;
    }
    return municipios || [];
  }, [searchTerm, allMunicipios, municipios]);

  // 1. Filtragem inteligente: Município, Sigla da UF, Nome Completo da UF, Região e Código IBGE
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return sourceList;
    const q = normalizeText(searchTerm);

    return sourceList.filter(m => {
      const nomeMun = normalizeText(m.name);
      const siglaUf = normalizeText(m.uf);
      const nomeUf = normalizeText(UF_FULL_NAMES[m.uf] || m.uf_nome || '');
      const regiao = normalizeText(m.reg);
      const codIbge = String(m.id);

      return (
        nomeMun.includes(q) ||
        siglaUf.includes(q) ||
        nomeUf.includes(q) ||
        regiao.includes(q) ||
        codIbge.includes(q)
      );
    });
  }, [sourceList, searchTerm]);

  // 2. Ordenação por TODAS as colunas
  const sortedData = useMemo(() => {
    const list = [...filteredData];
    return list.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'id') {
        comparison = a.id - b.id;
      } else if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name, 'pt-BR');
      } else if (sortBy === 'uf') {
        comparison = a.uf.localeCompare(b.uf);
      } else if (sortBy === 'reg') {
        comparison = a.reg.localeCompare(b.reg, 'pt-BR');
      } else if (sortBy === 'bov') {
        comparison = a.bov - b.bov;
      } else if (sortBy === 'pop') {
        comparison = a.pop - b.pop;
      } else if (sortBy === 'razao') {
        comparison = a.razao - b.razao;
      } else if (sortBy === 'saldo') {
        // Diferença matemática (Bois - Pessoas)
        const saldoA = a.bov - a.pop;
        const saldoB = b.bov - b.pop;
        comparison = saldoA - saldoB;
      } else if (sortBy === 'mais_boi') {
        comparison = a.mais_boi - b.mais_boi;
      } else {
        comparison = a.bov - b.bov;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [filteredData, sortBy, sortOrder]);

  // 3. Paginação
  const totalRecords = sortedData.length;
  const isAllPages = pageSize === 'all';
  const recordsPerPage = isAllPages ? totalRecords : Number(pageSize);
  const totalPages = isAllPages || totalRecords === 0 ? 1 : Math.ceil(totalRecords / recordsPerPage);
  const activePage = Math.min(currentPage, totalPages || 1);

  const paginatedData = useMemo(() => {
    if (isAllPages) return sortedData;
    const start = (activePage - 1) * recordsPerPage;
    return sortedData.slice(start, start + recordsPerPage);
  }, [sortedData, isAllPages, activePage, recordsPerPage]);

  const startIndex = isAllPages ? 0 : (activePage - 1) * recordsPerPage;
  const endIndex = isAllPages ? totalRecords : Math.min(startIndex + recordsPerPage, totalRecords);

  // Manipulador de ordenação ao clicar no cabeçalho
  const handleSortColumn = (columnKey, defaultOrder = 'desc') => {
    if (sortBy === columnKey) {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(columnKey);
      setSortOrder(defaultOrder);
    }
    setCurrentPage(1);
  };

  // Indicador visual de ordenação bem visível e aparente
  const renderSortIndicator = (columnKey) => {
    const isActive = sortBy === columnKey;
    if (isActive) {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          marginLeft: '6px',
          color: 'var(--color-amber)',
          background: 'rgba(245, 158, 11, 0.15)',
          padding: '2px 4px',
          borderRadius: '4px',
          verticalAlign: 'middle'
        }}>
          {sortOrder === 'desc' ? (
            <ChevronDown size={15} strokeWidth={2.8} />
          ) : (
            <ChevronUp size={15} strokeWidth={2.8} />
          )}
        </span>
      );
    }

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        marginLeft: '6px',
        color: '#94A3B8',
        opacity: 0.65,
        verticalAlign: 'middle'
      }}>
        <ArrowUpDown size={13} strokeWidth={2} />
      </span>
    );
  };

  // Exportar dados em CSV com BOM UTF-8
  const downloadCSV = () => {
    const headers = ['Cod_IBGE;Municipio;UF;Regiao;Total_Bois;Total_Pessoas;Razao_Boi_Pessoa;Diferenca_Bois_Menos_Pessoas;Diagnostico'];
    const rows = sortedData.map(m => {
      const saldo = m.bov - m.pop;
      const saldoStr = saldo > 0 ? `+${saldo}` : `${saldo}`;
      const diag = m.mais_boi === 1 ? 'Mais Boi que Gente' : 'Mais Gente que Boi';
      return `${m.id};"${m.name}";${m.uf};"${m.reg}";${m.bov};${m.pop};${m.razao.toFixed(2).replace('.', ',')};${saldoStr};"${diag}"`;
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
      {/* Barra de Controles: Busca, Informação de Ordenação e Exportação */}
      <div className="table-controls-row">
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
          {/* Campo de Busca Ampla */}
          <div className="search-box-wrapper" style={{ minWidth: '280px', flex: 1, maxWidth: '440px' }}>
            <Search size={16} color="var(--text-subtle)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input
              type="text"
              className="search-input"
              placeholder="🔍 Buscar por município, UF, estado ou região..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{ paddingLeft: '36px' }}
            />
          </div>

          {/* Informação: Clique nas colunas para ordenar */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.82rem',
            color: 'var(--text-main)',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            padding: '8px 12px',
            borderRadius: '8px',
            userSelect: 'none'
          }}>
            <Info size={14} color="var(--color-amber)" />
            <span>Clique nas colunas para ordenar</span>
          </div>

          {/* Quantidade de Registros por Página */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', whiteSpace: 'nowrap' }}>Exibir:</span>
            <select
              className="select-control"
              value={pageSize}
              onChange={(e) => {
                setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{ minWidth: '130px' }}
            >
              <option value={100}>100 registros</option>
              <option value={200}>200 registros</option>
              <option value={500}>500 registros</option>
              <option value="all">Todos ({formatNumber(totalRecords)})</option>
            </select>
          </div>
        </div>

        {/* Botão de Exportação */}
        <button className="btn-primary" onClick={downloadCSV} title="Exportar dados completos em formato CSV">
          <Download size={15} /> Exportar CSV ({formatNumber(totalRecords)} cidades)
        </button>
      </div>

      {/* Indicador de Escopo da Busca */}
      {searchTerm && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(245, 158, 11, 0.06)',
          borderLeft: '3px solid var(--color-amber)',
          borderRadius: '4px',
          padding: '8px 12px',
          marginBottom: '12px',
          fontSize: '0.82rem',
          color: 'var(--text-main)'
        }}>
          <div>
            Busca ativa por "<strong>{searchTerm}</strong>": <strong>{formatNumber(totalRecords)}</strong> {totalRecords === 1 ? 'cidade encontrada' : 'cidades encontradas'} em todo o Brasil.
          </div>
          <button
            onClick={() => setSearchTerm('')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-amber)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.8rem'
            }}
          >
            Limpar busca
          </button>
        </div>
      )}

      {/* Tabela de Dados com Todas as Colunas Clicáveis */}
      <div className="table-responsive" style={{ maxHeight: '550px', overflow: 'auto' }}>
        <table className="data-table" style={{ minWidth: '880px' }}>
          <thead>
            <tr>
              <th
                onClick={() => handleSortColumn('id', 'asc')}
                style={{ whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}
                title="Clique para ordenar por Código IBGE"
              >
                Cód. IBGE {renderSortIndicator('id')}
              </th>
              <th
                onClick={() => handleSortColumn('name', 'asc')}
                style={{ whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}
                title="Clique para ordenar por Nome do Município"
              >
                Município {renderSortIndicator('name')}
              </th>
              <th
                onClick={() => handleSortColumn('uf', 'asc')}
                style={{ whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}
                title="Clique para ordenar por Estado (UF)"
              >
                UF {renderSortIndicator('uf')}
              </th>
              <th
                onClick={() => handleSortColumn('reg', 'asc')}
                style={{ whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}
                title="Clique para ordenar por Grande Região"
              >
                Região {renderSortIndicator('reg')}
              </th>
              <th
                onClick={() => handleSortColumn('bov', 'desc')}
                style={{ textAlign: 'right', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}
                title="Clique para ordenar por Total de Bois"
              >
                Total de Bois {renderSortIndicator('bov')}
              </th>
              <th
                onClick={() => handleSortColumn('pop', 'desc')}
                style={{ textAlign: 'right', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}
                title="Clique para ordenar por Total de Pessoas"
              >
                Total de Pessoas {renderSortIndicator('pop')}
              </th>
              <th
                onClick={() => handleSortColumn('razao', 'desc')}
                style={{ textAlign: 'right', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}
                title="Clique para ordenar por Razão (Bois por Pessoa)"
              >
                Razão (Bois/Pessoa) {renderSortIndicator('razao')}
              </th>
              <th
                onClick={() => handleSortColumn('saldo', 'desc')}
                style={{ textAlign: 'right', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}
                title="Clique para ordenar por Diferença (Bois - Pessoas)"
              >
                Diferença (Bois - Pessoas) {renderSortIndicator('saldo')}
              </th>
              <th
                onClick={() => handleSortColumn('mais_boi', 'desc')}
                style={{ whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}
                title="Clique para ordenar por Classificação de Diagnóstico"
              >
                Diagnóstico {renderSortIndicator('mais_boi')}
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-subtle)' }}>
                  Nenhum município encontrado para "{searchTerm}".
                </td>
              </tr>
            ) : (
              paginatedData.map(m => {
                const saldo = m.bov - m.pop;
                const temMaisBoi = m.mais_boi === 1;

                // Formatação com sinal de + e -
                let saldoFormatado = '0';
                if (saldo > 0) {
                  saldoFormatado = `+${formatNumber(saldo)}`;
                } else if (saldo < 0) {
                  saldoFormatado = `-${formatNumber(Math.abs(saldo))}`;
                }

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
                    <td style={{ textAlign: 'right', color: m.razao > 1 ? 'var(--color-amber)' : 'var(--color-emerald)', fontWeight: '600' }}>
                      {m.razao.toFixed(2).replace('.', ',')}
                    </td>
                    <td style={{
                      textAlign: 'right',
                      color: saldo > 0 ? 'var(--color-amber)' : saldo < 0 ? 'var(--color-emerald)' : 'var(--text-subtle)',
                      fontWeight: '600'
                    }}>
                      {saldoFormatado}
                    </td>
                    <td>
                      <span className={`badge-status ${temMaisBoi ? 'badge-boi' : 'badge-gente'}`} style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
                        {temMaisBoi ? '🐂 Mais Boi que Gente' : '👥 Mais Gente que Boi'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Barra de Paginação & Navegação */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '16px',
        paddingTop: '14px',
        borderTop: '1px solid var(--border-subtle)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          {totalRecords === 0 ? (
            'Nenhum registro para exibir.'
          ) : (
            <>
              Exibindo <strong>{formatNumber(startIndex + 1)}</strong> a <strong>{formatNumber(endIndex)}</strong> de <strong>{formatNumber(totalRecords)}</strong> municípios
              {searchTerm && <span> (filtrados por "<em>{searchTerm}</em>")</span>}
            </>
          )}
        </div>

        {!isAllPages && totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              className="btn-primary"
              style={{ padding: '5px 10px', fontSize: '0.78rem' }}
              disabled={activePage === 1}
              onClick={() => setCurrentPage(1)}
              title="Primeira página"
            >
              « Primeira
            </button>
            <button
              className="btn-primary"
              style={{ padding: '5px 10px', fontSize: '0.78rem' }}
              disabled={activePage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              title="Página anterior"
            >
              ‹ Anterior
            </button>

            <span style={{ fontSize: '0.82rem', color: 'var(--text-main)', margin: '0 8px', fontWeight: 500 }}>
              Página {activePage} de {totalPages}
            </span>

            <button
              className="btn-primary"
              style={{ padding: '5px 10px', fontSize: '0.78rem' }}
              disabled={activePage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              title="Próxima página"
            >
              Próxima ›
            </button>
            <button
              className="btn-primary"
              style={{ padding: '5px 10px', fontSize: '0.78rem' }}
              disabled={activePage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              title="Última página"
            >
              Última »
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

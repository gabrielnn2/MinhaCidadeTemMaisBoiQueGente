import React, { useState, useMemo } from 'react';
import { Download, Search, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';

export default function DataTableTab({ municipios, allMunicipios }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('bov'); // 'bov' | 'razao' | 'pop' | 'saldo' | 'name' | 'uf' | 'id'
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'
  const [pageSize, setPageSize] = useState(200); // 100 | 200 | 500 | 'all'
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInAll, setSearchInAll] = useState(true);

  const formatNumber = (val) => Number(val || 0).toLocaleString('pt-BR');

  // Base de dados para a busca:
  // Se houver termo de busca e searchInAll estiver ativo, pesquisa em todas as 5.570 cidades do Brasil
  const sourceList = useMemo(() => {
    if (searchTerm.trim() && searchInAll && allMunicipios && allMunicipios.length > 0) {
      return allMunicipios;
    }
    return municipios || [];
  }, [searchTerm, searchInAll, allMunicipios, municipios]);

  // 1. Filtragem por busca (nome, UF ou código IBGE)
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return sourceList;
    const q = searchTerm.toLowerCase().trim();
    return sourceList.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.uf.toLowerCase().includes(q) ||
      String(m.id).includes(q)
    );
  }, [sourceList, searchTerm]);

  // 2. Ordenação dinâmica
  const sortedData = useMemo(() => {
    const list = [...filteredData];
    return list.sort((a, b) => {
      let valA, valB;
      if (sortBy === 'bov') {
        valA = a.bov;
        valB = b.bov;
      } else if (sortBy === 'razao') {
        valA = a.razao;
        valB = b.razao;
      } else if (sortBy === 'pop') {
        valA = a.pop;
        valB = b.pop;
      } else if (sortBy === 'saldo') {
        valA = Math.abs(a.bov - a.pop);
        valB = Math.abs(b.bov - b.pop);
      } else if (sortBy === 'name') {
        return sortOrder === 'asc'
          ? a.name.localeCompare(b.name, 'pt-BR')
          : b.name.localeCompare(a.name, 'pt-BR');
      } else if (sortBy === 'uf') {
        return sortOrder === 'asc'
          ? a.uf.localeCompare(b.uf)
          : b.uf.localeCompare(a.uf);
      } else if (sortBy === 'id') {
        valA = a.id;
        valB = b.id;
      } else {
        valA = a.bov;
        valB = b.bov;
      }

      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });
  }, [filteredData, sortBy, sortOrder]);

  // 3. Paginação dos dados ordenados
  const totalRecords = sortedData.length;
  const isAllPages = pageSize === 'all';
  const recordsPerPage = isAllPages ? totalRecords : Number(pageSize);
  const totalPages = isAllPages || totalRecords === 0 ? 1 : Math.ceil(totalRecords / recordsPerPage);

  // Garantir que a página atual seja válida ao filtrar/ordenar
  const activePage = Math.min(currentPage, totalPages || 1);

  const paginatedData = useMemo(() => {
    if (isAllPages) return sortedData;
    const start = (activePage - 1) * recordsPerPage;
    return sortedData.slice(start, start + recordsPerPage);
  }, [sortedData, isAllPages, activePage, recordsPerPage]);

  const startIndex = isAllPages ? 0 : (activePage - 1) * recordsPerPage;
  const endIndex = isAllPages ? totalRecords : Math.min(startIndex + recordsPerPage, totalRecords);

  // Manipulador de clique no cabeçalho das colunas
  const handleSortColumn = (columnKey, defaultOrder = 'desc') => {
    if (sortBy === columnKey) {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(columnKey);
      setSortOrder(defaultOrder);
    }
    setCurrentPage(1);
  };

  // Indicador visual de ordenação no cabeçalho
  const renderSortIndicator = (columnKey) => {
    if (sortBy !== columnKey) {
      return <ArrowUpDown size={12} style={{ opacity: 0.3, marginLeft: '4px', verticalAlign: 'middle' }} />;
    }
    return sortOrder === 'desc'
      ? <ChevronDown size={14} style={{ color: 'var(--color-amber)', marginLeft: '4px', verticalAlign: 'middle' }} />
      : <ChevronUp size={14} style={{ color: 'var(--color-amber)', marginLeft: '4px', verticalAlign: 'middle' }} />;
  };

  // Exportar dados em CSV com BOM UTF-8
  const downloadCSV = () => {
    const headers = ['Cod_IBGE;Municipio;UF;Regiao;Total_Bois;Total_Pessoas;Razao_Boi_Pessoa;Diferenca_Absoluta;Diagnostico'];
    const rows = sortedData.map(m => {
      const diff = Math.abs(m.bov - m.pop);
      const diag = m.mais_boi === 1 ? 'Mais Boi que Gente' : 'Mais Gente que Boi';
      return `${m.id};"${m.name}";${m.uf};"${m.reg}";${m.bov};${m.pop};${m.razao.toFixed(2).replace('.', ',')};${diff};"${diag}"`;
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
      {/* Barra de Controles: Busca, Ordenação e Exportação */}
      <div className="table-controls-row">
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
          {/* Campo de Busca */}
          <div className="search-box-wrapper" style={{ minWidth: '260px', flex: 1, maxWidth: '420px' }}>
            <Search size={16} color="var(--text-subtle)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input
              type="text"
              className="search-input"
              placeholder="🔍 Buscar cidade, UF ou código IBGE..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{ paddingLeft: '36px' }}
            />
          </div>

          {/* Seletor de Ordenação Rápida */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', whiteSpace: 'nowrap' }}>Ordenar por:</span>
            <select
              className="select-control"
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [col, ord] = e.target.value.split('-');
                setSortBy(col);
                setSortOrder(ord);
                setCurrentPage(1);
              }}
              style={{ minWidth: '210px' }}
            >
              <option value="bov-desc">🐂 Mais Bois (Decrescente)</option>
              <option value="bov-asc">🐂 Menos Bois (Crescente)</option>
              <option value="razao-desc">📈 Maior Razão Boi/Pessoa</option>
              <option value="razao-asc">📉 Menor Razão Boi/Pessoa</option>
              <option value="pop-desc">👥 Mais População (Decrescente)</option>
              <option value="pop-asc">👥 Menos População (Crescente)</option>
              <option value="saldo-desc">⚖️ Maior Diferença Absoluta</option>
              <option value="name-asc">🔤 Município (A-Z)</option>
              <option value="name-desc">🔤 Município (Z-A)</option>
            </select>
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

      {/* Tabela de Dados */}
      <div className="table-responsive" style={{ maxHeight: '550px', overflow: 'auto' }}>
        <table className="data-table" style={{ minWidth: '820px' }}>
          <thead>
            <tr>
              <th
                onClick={() => handleSortColumn('id', 'asc')}
                style={{ whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}
                title="Ordenar por Código IBGE"
              >
                Cód. IBGE {renderSortIndicator('id')}
              </th>
              <th
                onClick={() => handleSortColumn('name', 'asc')}
                style={{ whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}
                title="Ordenar por Nome do Município"
              >
                Município {renderSortIndicator('name')}
              </th>
              <th
                onClick={() => handleSortColumn('uf', 'asc')}
                style={{ whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}
                title="Ordenar por Estado (UF)"
              >
                UF {renderSortIndicator('uf')}
              </th>
              <th style={{ whiteSpace: 'nowrap' }}>Região</th>
              <th
                onClick={() => handleSortColumn('bov', 'desc')}
                style={{ textAlign: 'right', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}
                title="Ordenar por Total de Bois"
              >
                Total de Bois {renderSortIndicator('bov')}
              </th>
              <th
                onClick={() => handleSortColumn('pop', 'desc')}
                style={{ textAlign: 'right', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}
                title="Ordenar por Total de Pessoas"
              >
                Total de Pessoas {renderSortIndicator('pop')}
              </th>
              <th
                onClick={() => handleSortColumn('razao', 'desc')}
                style={{ textAlign: 'right', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}
                title="Ordenar por Razão Boi por Pessoa"
              >
                Razão (Bois/Pessoa) {renderSortIndicator('razao')}
              </th>
              <th
                onClick={() => handleSortColumn('saldo', 'desc')}
                style={{ textAlign: 'right', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}
                title="Ordenar por Diferença Absoluta"
              >
                Diferença {renderSortIndicator('saldo')}
              </th>
              <th style={{ whiteSpace: 'nowrap' }}>Diagnóstico</th>
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
                const diff = Math.abs(m.bov - m.pop);
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
                    <td style={{ textAlign: 'right', color: m.razao > 1 ? 'var(--color-amber)' : 'var(--color-emerald)', fontWeight: '600' }}>
                      {m.razao.toFixed(2).replace('.', ',')}
                    </td>
                    <td style={{ textAlign: 'right', color: temMaisBoi ? 'var(--color-amber)' : 'var(--color-emerald)' }}>
                      {formatNumber(diff)}
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

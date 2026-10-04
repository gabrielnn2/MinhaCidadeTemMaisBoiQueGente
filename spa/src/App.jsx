import React, { useState, useEffect, useMemo, useRef } from 'react';
import MapComponent from './components/MapComponent';
import CityInspector from './components/CityInspector';
import SegmentationTab from './components/SegmentationTab';
import DataTableTab from './components/DataTableTab';
import DocumentationTab from './components/DocumentationTab';

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('mapa');

  // Filtros
  const [regFilter, setRegFilter] = useState('Todas as Regiões');
  const [ufFilter, setUfFilter] = useState('Todas as UFs');
  const [classFilter, setClassFilter] = useState('todos');

  // Cidade Selecionada (null = Brasil Consolidado por padrão!)
  const [selectedCity, setSelectedCity] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    fetch('/data/dados_brasil.json')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao carregar dados:', err);
        setLoading(false);
      });
  }, []);

  // Fechar dropdown de busca ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Limpar busca quando a seleção de cidade voltar para Brasil
  useEffect(() => {
    if (!selectedCity) {
      setSearchQuery('');
    }
  }, [selectedCity]);

  const formatNumber = (val) => Number(val || 0).toLocaleString('pt-BR');

  const UF_NAMES = {
    AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia',
    CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás',
    MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais',
    PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí',
    RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul',
    RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo',
    SE: 'Sergipe', TO: 'Tocantins'
  };

  // Regiões e UFs disponíveis
  const regioesDisponiveis = useMemo(() => {
    if (!data) return [];
    return ['Todas as Regiões', ...Array.from(new Set(data.municipios.map(m => m.reg))).sort()];
  }, [data]);

  const ufsDisponiveis = useMemo(() => {
    if (!data) return [];
    let list = data.municipios;
    if (regFilter !== 'Todas as Regiões') {
      list = list.filter(m => m.reg === regFilter);
    }
    const ufs = Array.from(new Set(list.map(m => m.uf))).sort();
    return [
      { sigla: 'Todas as UFs', label: 'Todas as UFs' },
      ...ufs.map(uf => ({ sigla: uf, label: `${UF_NAMES[uf] || uf} (${uf})` }))
    ];
  }, [data, regFilter]);

  // Municípios filtrados pelo recorte ativo
  const filteredMunicipios = useMemo(() => {
    if (!data) return [];
    return data.municipios.filter(m => {
      if (regFilter !== 'Todas as Regiões' && m.reg !== regFilter) return false;
      if (ufFilter !== 'Todas as UFs' && m.uf !== ufFilter) return false;
      if (classFilter === 'mais_boi' && m.mais_boi !== 1) return false;
      if (classFilter === 'mais_pessoas' && m.mais_boi !== 0) return false;
      return true;
    });
  }, [data, regFilter, ufFilter, classFilter]);

  // Métricas do recorte atual
  const kpis = useMemo(() => {
    if (!filteredMunicipios || filteredMunicipios.length === 0) {
      return { totalBov: 0, totalPop: 0, saldo: 0, razao: 0, totalMun: 0, cidadesMaisBoi: 0, cidadesMaisGente: 0, pctMaisBoi: 0, pctMaisGente: 0 };
    }
    const totalBov = filteredMunicipios.reduce((acc, m) => acc + m.bov, 0);
    const totalPop = filteredMunicipios.reduce((acc, m) => acc + m.pop, 0);
    const saldo = totalBov - totalPop;
    const razao = totalPop > 0 ? totalBov / totalPop : 0;
    const totalMun = filteredMunicipios.length;
    const cidadesMaisBoi = filteredMunicipios.filter(m => m.mais_boi === 1).length;
    const cidadesMaisGente = totalMun - cidadesMaisBoi;
    const pctMaisBoi = (cidadesMaisBoi / totalMun) * 100;
    const pctMaisGente = (cidadesMaisGente / totalMun) * 100;

    return { totalBov, totalPop, saldo, razao, totalMun, cidadesMaisBoi, cidadesMaisGente, pctMaisBoi, pctMaisGente };
  }, [filteredMunicipios]);

  // Lista de cidades para busca no autocompletar
  const searchResults = useMemo(() => {
    if (!data) return [];
    if (!searchQuery) return filteredMunicipios.slice(0, 30);
    const q = searchQuery.toLowerCase();
    return data.municipios.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.uf.toLowerCase().includes(q)
    ).slice(0, 40);
  }, [data, searchQuery, filteredMunicipios]);

  const handleResetBrasil = () => {
    setSelectedCity(null);
    setSearchQuery('');
    setRegFilter('Todas as Regiões');
    setUfFilter('Todas as UFs');
  };

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-app)', color: 'var(--text-muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🐂</div>
          <div style={{ fontSize: '1rem', fontWeight: 500 }}>Carregando dados oficiais e malha territorial...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header Minimal */}
      <div className="header-section">
        <div>
          <div className="title-main">Minha Cidade Tem Mais Boi Que Gente?</div>
          <div className="subtitle-main">
            Diagnóstico territorial interativo comparando a quantidade de bois e pessoas no Brasil com dados oficiais do IBGE (2025).
          </div>
        </div>

        {/* Link do LinkedIn (Preto e Branco) */}
        <a
          href="https://www.linkedin.com/in/gabrielnn"
          target="_blank"
          rel="noopener noreferrer"
          className="linkedin-link-btn"
          title="Perfil no LinkedIn"
          aria-label="Perfil no LinkedIn"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
          </svg>
        </a>
      </div>

      {/* Navegação por Abas */}
      <div className="tabs-nav">
        <button className={`tab-btn ${activeTab === 'mapa' ? 'active' : ''}`} onClick={() => setActiveTab('mapa')}>
          1. Mapa e leitura municipal
        </button>
        <button className={`tab-btn ${activeTab === 'segmentacao' ? 'active' : ''}`} onClick={() => setActiveTab('segmentacao')}>
          2. Leitura por Região e UF
        </button>
        <button className={`tab-btn ${activeTab === 'tabela' ? 'active' : ''}`} onClick={() => setActiveTab('tabela')}>
          3. Tabela de dados por município
        </button>
        <button className={`tab-btn ${activeTab === 'documentacao' ? 'active' : ''}`} onClick={() => setActiveTab('documentacao')}>
          4. Documentação
        </button>
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === 'mapa' && (
        <div className="map-layout">
          {/* Mapa MapLibre em Polígonos */}
          <MapComponent
            selectedCity={selectedCity}
            onSelectCity={(city) => {
              setSelectedCity(city);
              setSearchQuery(city ? `${city.name} (${city.uf})` : '');
            }}
            onResetBrasil={handleResetBrasil}
            ufFilter={ufFilter}
            regFilter={regFilter}
            classFilter={classFilter}
          />

          {/* Painel Lateral: Filtros, Busca & Inspetor (Brasil / Cidade) */}
          <div className="map-sidebar-column">
            {/* Filtros de Recorte (Região e UF) logo acima da seleção de município */}
            <div className="filter-row" style={{ marginBottom: '12px' }}>
              <select
                className="select-control"
                value={regFilter}
                onChange={(e) => {
                  setRegFilter(e.target.value);
                  setUfFilter('Todas as UFs');
                  setSelectedCity(null);
                }}
                style={{ flex: 1 }}
              >
                {regioesDisponiveis.map(r => <option key={r} value={r}>{r}</option>)}
              </select>

              <select
                className="select-control"
                value={ufFilter}
                onChange={(e) => {
                  setUfFilter(e.target.value);
                  setSelectedCity(null);
                }}
                style={{ flex: 1 }}
              >
                {ufsDisponiveis.map(u => <option key={u.sigla} value={u.sigla}>{u.label}</option>)}
              </select>
            </div>

            {/* Campo de Busca Rápido (Seleção de Município) */}
            <div className="search-container" ref={searchContainerRef}>
              <input
                type="text"
                className="search-input"
                placeholder="🔍 Buscar cidade ou escolher Brasil..."
                value={searchQuery}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
              />

              {isSearchOpen && (
                <div className="search-dropdown">
                  <div
                    className={`search-item ${!selectedCity ? 'selected' : ''}`}
                    onClick={() => {
                      handleResetBrasil();
                      setIsSearchOpen(false);
                    }}
                  >
                    <strong>🇧🇷 Brasil (Visão Agregada - Todos os Municípios)</strong>
                  </div>

                  {searchResults.map(c => (
                    <div
                      key={c.id}
                      className={`search-item ${selectedCity && selectedCity.id === c.id ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedCity(c);
                        setSearchQuery(`${c.name} (${c.uf})`);
                        setIsSearchOpen(false);
                      }}
                    >
                      {c.name} ({c.uf}) • {c.mais_boi === 1 ? '🐂 Mais Boi' : '👥 Mais Pessoas'}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inspetor (Agregado Especial do Brasil ou Cidade Selecionada) */}
            <CityInspector
              selectedCity={selectedCity}
              onResetCity={handleResetBrasil}
              onResetBrasil={handleResetBrasil}
              nationalSummary={kpis}
              anos={data.anos}
              cityHistory={data.historico_municipios}
              regFilter={regFilter}
              ufFilter={ufFilter}
            />
          </div>
        </div>
      )}

      {activeTab === 'segmentacao' && (
        <SegmentationTab municipios={filteredMunicipios} nationalHistory={data.br_hist} />
      )}

      {activeTab === 'tabela' && (
        <DataTableTab municipios={filteredMunicipios} />
      )}

      {activeTab === 'documentacao' && (
        <DocumentationTab />
      )}
    </div>
  );
}

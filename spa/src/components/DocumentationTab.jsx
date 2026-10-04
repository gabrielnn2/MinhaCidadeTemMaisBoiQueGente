import React from 'react';

export default function DocumentationTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px', margin: '0 auto', paddingBottom: '30px' }}>
      {/* Cabeçalho da Documentação */}
      <div className="card-box" style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--text-main)', fontFamily: 'var(--font-display)' }}>
            Documentação da Plataforma
          </div>
        </div>
        <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Esta plataforma é uma ferramenta analítica interativa que compara o efetivo de bovinos e o contingente populacional residente em todos os 5.567 municípios do Brasil. A seguir estão descritas as fontes de dados oficiais, a metodologia dos indicadores calculados e a arquitetura tecnológica do sistema.
        </div>
      </div>

      {/* Grid de 3 Pilares Principais */}
      <div className="doc-grid">
        {/* Pilar 1: Fontes de Dados */}
        <div className="card-box" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ color: 'var(--color-amber)', fontSize: '1.05rem', fontWeight: '600' }}>
            1. Fontes de Dados Oficiais
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            <div style={{ padding: '10px 12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '6px', borderLeft: '3px solid var(--color-amber)' }}>
              <div style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '3px' }}>
                Efetivo de Bovinos (PPM / IBGE)
              </div>
              Dados extraídos da <strong>Pesquisa da Pecuária Municipal (PPM)</strong> do IBGE (<a href="https://sidra.ibge.gov.br/Tabela/3939" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-amber)', textDecoration: 'underline' }}>Tabela 3939</a> via SIDRA), contemplando a quantidade anual oficial de animais do rebanho bovino por município.
            </div>

            <div style={{ padding: '10px 12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '6px', borderLeft: '3px solid var(--color-emerald)' }}>
              <div style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '3px' }}>
                População Residente
              </div>
              Dados extraídos das Estimativas da População do IBGE (<a href="https://sidra.ibge.gov.br/tabela/6579" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-emerald)', textDecoration: 'underline' }}>Tabela 6579</a> via SIDRA), contemplando a quantidade anual de pessoas por município.
            </div>

            <div style={{ padding: '10px 12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '6px', borderLeft: '3px solid #3B82F6' }}>
              <div style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '3px' }}>
                Malha Geográfica Vetorial (IBGE Geociências)
              </div>
              Malhas cartográficas dos 5.567 municípios e das 27 Unidades da Federação na projeção SIRGAS 2000 / WGS84, estruturadas para visualização geoespacial vetorial.
            </div>
          </div>
        </div>

        {/* Pilar 2: Indicadores Criados */}
        <div className="card-box" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ color: 'var(--color-emerald)', fontSize: '1.05rem', fontWeight: '600' }}>
            2. Indicadores e Metodologia
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            <div style={{ padding: '10px 12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '6px', borderLeft: '3px solid var(--color-amber)' }}>
              <div style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '3px' }}>
                Classificação Territorial Binária
              </div>
              Classificação fundamental que divide os municípios em duas categorias mutuamente exclusivas:
              <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                <li><strong>Mais Boi que Gente:</strong> quando o total de bois é maior que o total de pessoas (Bois &gt; Pessoas).</li>
                <li><strong>Mais Gente que Boi:</strong> quando o total de pessoas é maior que total de bois (Pessoas &gt; Bois).</li>
              </ul>
            </div>

            <div style={{ padding: '10px 12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '6px', borderLeft: '3px solid var(--color-emerald)' }}>
              <div style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '3px' }}>
                Razão Boi / Pessoa
              </div>
              Calculada por <code>Razão = Total de Bois ÷ Total de Pessoas</code>. Mede a densidade per capita de bovinos (quantos bois existem para cada habitante na cidade ou região).
            </div>

            <div style={{ padding: '10px 12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '6px', borderLeft: '3px solid #8B5CF6' }}>
              <div style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '3px' }}>
                Diferença
              </div>
              Calculada por <code>Diferença = Total de Bois - Total de Pessoas</code>. Expressa o balanço numérico direto entre os dois volumes populacionais.
            </div>
          </div>
        </div>

        {/* Pilar 3: Arquitetura da Plataforma */}
        <div className="card-box" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ color: '#38BDF8', fontSize: '1.05rem', fontWeight: '600' }}>
            3. Arquitetura da Plataforma
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            <div style={{ padding: '10px 12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '6px', borderLeft: '3px solid #38BDF8' }}>
              <div style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '3px' }}>
                Frontend Moderno (React 19 + Vite)
              </div>
              Single Page Application (SPA) construída com arquitetura de componentes reativos, alta velocidade de carregamento e consumo estático otimizado.
            </div>

            <div style={{ padding: '10px 12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '6px', borderLeft: '3px solid #F43F5E' }}>
              <div style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '3px' }}>
                Renderização Acelerada na GPU (MapLibre GL JS)
              </div>
              Motor cartográfico vetorial WebGL com renderização na GPU e <code>feature-state</code> nativo, permitindo destaque instantâneo (0ms de atraso) dos 5.567 polígonos sem travamentos.
            </div>

            <div style={{ padding: '10px 12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '6px', borderLeft: '3px solid #10B981' }}>
              <div style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '3px' }}>
                Otimização Topológica (TopoJSON + Shapely)
              </div>
              Simplificação coordenada de fronteiras compartilhadas (arcos idênticos sem frestas ou sobreposições) e reparação geométrica com <code>make_valid</code>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

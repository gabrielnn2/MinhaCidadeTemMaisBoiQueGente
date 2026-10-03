# Minha Cidade Tem Mais Boi Que Gente? 🐂 vs 👥

Uma plataforma analítica moderna e interativa que compara o efetivo de bovinos (**bois**) e o contingente humano (**pessoas**) em todos os **5.567 municípios do Brasil**, utilizando dados oficiais do **IBGE** (Pesquisa da Pecuária Municipal - PPM e Estimativas/Censo Demográfico).

---

## 🌟 Destaques da Plataforma

- 🗺️ **Mapa Vetorial com Aceleração por GPU (WebGL)**: Todos os 5.567 municípios renderizados como **polígonos territoriais** com 60 FPS via **MapLibre GL JS**.
- ⚡ **Otimização Topológica Extrema**: Geometrias simplificadas via algoritmo Douglas-Peucker com quantização de coordenadas, reduzindo a malha de 21,5 MB para **4,9 MB** (redução de 77%) sem perda visual discernível.
- 🎯 **Navegação & Zoom Preciso**: Bounding boxes geográficos exatos para todas as 27 Unidades Federativas e as 5 Macrorregiões brasileiras, com isolamento instantâneo do polígono municipal ao selecionar uma cidade.
- 🐂 **Padronização Terminológica Rigorosa**:
  - Uso exclusivo do termo **"bois"** para o rebanho bovino (jamais "cabeça de gado").
  - Uso exclusivo do termo **"pessoas"** para o contingente humano.
  - Indicadores padronizados: *"Mais Boi que Gente"* e *"Mais Gente que Boi"*.
- 🇧🇷 **Agregado Especial do Brasil**: Diagnóstico nacional consolidado exibido por padrão ao carregar a plataforma.
- 📊 **Segmentação & Rankings**: Gráficos de volumes por macrorregião, ranking estadual de densidade (bois por pessoa) e Top 10 cidades.
- 📋 **Tabela de Dados**: Busca instantânea, ordenação por colunas e exportação em CSV com separador decimal em vírgula.
- 📖 **Aba de Documentação**: Explicação transparente das fontes oficiais, fórmulas dos indicadores e decisões de arquitetura.
- 🎨 **Design System Minimalista**: Paleta *Obsidian Dark* de alto contraste, tipografia Inter & Outfit e favicon oficial personalizado (`🐂`).

---

## 🏗️ Arquitetura do Projeto

O projeto é estruturado em uma arquitetura desacoplada:

```text
MinhaCidadeTemMaisBoiQueGente/
├── 1_Dados_Recebidos/        # Dados brutos baixados do IBGE (SIDRA, DTB)
├── 2_Dados_Tratados/         # Limpeza e padronização intermediária
├── 3_Dados_Processados/      # Bases finais consolidadas (CSV, Parquet, GeoJSON)
├── frontend_data/            # Dados agregados exportados para o frontend
├── scripts/                  # Scripts utilitários de conversão e simplificação de malhas
├── spa/                      # Single Page Application moderna (React 19 + Vite)
│   ├── public/
│   │   ├── data/             # Dados JSON e geometrias GeoJSON servidas estaticamente
│   │   └── favicon.svg       # Favicon vetorial com ícone de boi (🐂)
│   ├── src/
│   │   ├── components/
│   │   │   ├── CityInspector.jsx      # Painel de raio-x do município e agregado Brasil
│   │   │   ├── DataTableTab.jsx       # Tabela completa paginada com exportação CSV
│   │   │   ├── DocumentationTab.jsx   # Aba de documentação, fontes e metodologia
│   │   │   ├── MapComponent.jsx       # Mapa interativo MapLibre GL com WebGL
│   │   │   └── SegmentationTab.jsx    # Análises regionais e rankings com Recharts
│   │   ├── App.jsx                    # Orquestração de estado global, KPIs e filtros
│   │   ├── index.css                  # Tokens de design minimal dark
│   │   └── main.jsx
│   └── package.json
├── MinhaCidadeTemMaisBoiQueGente.py  # Dashboard protótipo em Streamlit
├── TratamentoDadosBase.py            # Consolidação das bases de bovinos e população
├── TratamentoDadosBovinos.py         # Pipeline de extração e limpeza da PPM/IBGE
├── TratamentoDadosMunicipios.py      # Pipeline da Divisão Territorial Brasileira
├── TratamentoDadosPopulacao.py       # Pipeline de séries populacionais
└── requirements.txt                  # Dependências Python
```

---

## 🚀 Como Executar

### 1. Aplicação Web (SPA - Recomendado)

A aplicação principal é uma SPA estática de alta velocidade construída com **React 19 + Vite**:

```bash
cd spa
npm install
npm run dev
```

Acesse em: `http://localhost:5173`

Para gerar o build de produção:
```bash
npm run build
npm run preview -- --port 3000
```

### 2. Pipelines de Dados (Python)

Para reprocessar ou atualizar as bases de dados oficiais:

```bash
pip install -r requirements.txt
python TratamentoDadosBovinos.py
python TratamentoDadosPopulacao.py
python TratamentoDadosMunicipios.py
python TratamentoDadosBase.py
```

### 3. Dashboard Streamlit (Legado / Prototipação)

```bash
streamlit run MinhaCidadeTemMaisBoiQueGente.py
```

---

## 📊 Fontes dos Dados

- **Efetivo Bovino**: IBGE - Pesquisa da Pecuária Municipal (PPM) — Tabela 3939 / SIDRA.
- **Contingente Populacional**: IBGE - Censos Demográficos e Estimativas Anuais de População Residente.
- **Malha Territorial**: IBGE - Malha Municipal Digital e Divisão Territorial do Brasil (DTB 2024).

---

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais detalhes.

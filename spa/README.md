# Minha Cidade Tem Mais Boi Que Gente — SPA Moderna

Aplicação Single Page Application (SPA) de alta performance construída com **React 19 + Vite + MapLibre GL JS + Recharts + Lucide Icons**.

---

## 🚀 Arquitetura e Decisões Técnicas

1. **Renderização Vetorial via WebGL (MapLibre GL JS)**:
   - Os 5.567 municípios brasileiros são renderizados como **polígonos territoriais** com aceleração por GPU a 60 FPS.
   - O GeoJSON dos municípios foi simplificado com o algoritmo Douglas-Peucker e quantização de coordenadas (`tolerance=0.007`), reduzindo a malha de 21,5 MB para **4,9 MB** (redução de 77%) sem perda visual discernível.
   - Ao filtrar um município, a camada de preenchimento (`fill`) e contorno (`line`) aplica filtros em nível de GPU (`map.setFilter`), isolando instantaneamente o município selecionado e animando a câmera (`map.flyTo`) para o centróide com zoom proporcional.

2. **Agregado Especial do Brasil**:
   - Ao carregar a aplicação, todos os municípios estão contemplados e o painel exibe automaticamente o diagnóstico nacional consolidado (2000 a 2026), com 5 KPIs dinâmicos e gráfico de evolução temporal.

3. **Padronização Terminológica Estrita**:
   - Utilização exclusiva do termo **"bois"** para o rebanho bovino (jamais "cabeça de gado").
   - Utilização exclusiva do termo **"pessoas"** para o contingente humano (jamais "habitantes" ou "residentes").

4. **Design Minimalista e Responsivo**:
   - Paleta de alto contraste escuro (*obsidian dark* `#080C15`, `#0F172A`, `#1E293B`).
   - Tipografia moderna com Outfit e Inter.
   - Tooltips flutuantes interativos no hover dos polígonos.
   - Abas temáticas:
     - 🗺️ **Mapa & Raio-X**: Visualização espacial e diagnóstico do município selecionado ou Brasil.
     - 📈 **Série Histórica (2000-2026)**: Curvas de evolução, índice Base 100 e balanço de municípios ao longo dos anos.
     - 📊 **Segmentação Regional & UFs**: Breakdown por macrorregião, ranking de proporção de bois por pessoa por UF e Top 10 cidades.
     - 📋 **Tabela Completa**: Busca instantânea, ordenação por colunas e exportação em CSV.

---

## 🛠️ Como Executar

### Pré-requisitos
- Node.js 18+ (recomendado Node 20 ou 22)
- npm

### Modo de Desenvolvimento
```bash
cd spa
npm install
npm run dev
```
O servidor de desenvolvimento estará disponível em `http://localhost:5173`.

### Build de Produção e Pré-visualização
```bash
cd spa
npm run build
npm run preview -- --port 3000
```
A versão de produção estará disponível em `http://localhost:3000`.

---

## 📁 Estrutura de Pastas

```text
spa/
├── public/
│   └── data/
│       ├── dados_brasil.json      # Dados consolidados (Brasil, UFs, Séries 2000-2026)
│       └── municipios_geo.json    # Polígonos GeoJSON simplificados com métricas
├── src/
│   ├── components/
│   │   ├── CityInspector.jsx      # Painel lateral do município ou Agregado Brasil
│   │   ├── DataTableTab.jsx       # Tabela completa paginada/filtrável com download CSV
│   │   ├── HistoricalTab.jsx      # Gráficos de evolução temporal (2000-2026)
│   │   ├── MapComponent.jsx       # Componente do mapa WebGL com MapLibre GL
│   │   └── SegmentationTab.jsx    # Análises regionais e rankings estaduais
│   ├── App.jsx                    # Header, Filtros, KPI cards e Tabs
│   ├── index.css                  # Design system minimalista e tokens CSS
│   └── main.jsx                   # Ponto de entrada React
└── package.json
```

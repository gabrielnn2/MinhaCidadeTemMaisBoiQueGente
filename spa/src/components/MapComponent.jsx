import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ArrowLeft } from 'lucide-react';

// Configurar Web Worker nativo do MapLibre GL v6
maplibregl.setWorkerUrl('/maplibre-gl-worker.mjs');

// Basemap ESRI World Dark Gray Canvas: 100% livre, sem chave de API, sem marca d'água
const MAP_STYLE = {
  version: 8,
  sources: {
    'esri-dark': {
      type: 'raster',
      tiles: [
        'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256,
      attribution: '&copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
    }
  },
  layers: [
    {
      id: 'esri-dark-layer',
      type: 'raster',
      source: 'esri-dark',
      minzoom: 0,
      maxzoom: 16
    }
  ]
};

const UF_BOUNDS = {
  RO: [[-66.8057, -13.6933], [-59.7738, -7.9689]],
  AC: [[-73.9909, -11.1448], [-66.6194, -7.1115]],
  AM: [[-73.801, -9.8177], [-56.0971, 2.2466]],
  RR: [[-64.8247, -1.5803], [-58.8864, 5.2722]],
  PA: [[-58.8971, -9.8407], [-46.0605, 2.5914]],
  AP: [[-54.8758, -1.2356], [-49.8758, 4.4371]],
  TO: [[-50.7416, -13.4673], [-45.6971, -5.168]],
  MA: [[-48.7547, -10.2612], [-41.7962, -1.0441]],
  PI: [[-45.9939, -10.9283], [-40.3701, -2.7389]],
  CE: [[-41.4231, -7.8578], [-37.2526, -2.784]],
  RN: [[-38.5812, -6.9823], [-34.9682, -4.8313]],
  PB: [[-38.765, -8.3025], [-34.7933, -6.0255]],
  PE: [[-41.358, -9.4825], [-32.3922, -3.8301]],
  AL: [[-38.2372, -10.4999], [-35.1523, -8.8127]],
  SE: [[-38.2447, -11.5682], [-36.3935, -9.5146]],
  BA: [[-46.6167, -18.3489], [-37.3408, -8.5331]],
  MG: [[-51.0455, -22.9223], [-39.8565, -14.2327]],
  ES: [[-41.8794, -21.3013], [-39.6656, -17.8915]],
  RJ: [[-44.8885, -23.3677], [-40.9564, -20.7635]],
  SP: [[-53.1094, -25.3118], [-44.1605, -19.7792]],
  PR: [[-54.6186, -26.7168], [-48.0231, -22.5158]],
  SC: [[-53.8358, -29.3509], [-48.3583, -25.9556]],
  RS: [[-57.6432, -33.7516], [-49.6911, -27.0801]],
  MS: [[-58.167, -24.0679], [-50.9227, -17.1662]],
  MT: [[-61.6328, -18.0411], [-50.2244, -7.3486]],
  GO: [[-53.2507, -19.4987], [-45.9065, -12.3955]],
  DF: [[-48.2867, -16.0513], [-47.3078, -15.4997]]
};

const REG_BOUNDS = {
  Norte: [[-73.9909, -13.6933], [-45.6971, 5.2722]],
  Nordeste: [[-48.7547, -18.3489], [-32.3922, -1.0441]],
  Sudeste: [[-53.1094, -25.3118], [-39.6656, -14.2327]],
  Sul: [[-57.6432, -33.7516], [-48.0231, -22.5158]],
  'Centro-Oeste': [[-61.6328, -24.0679], [-45.9065, -7.3486]]
};

const BRAZIL_BOUNDS = [
  [-73.9903, -33.7516], // Sudoeste: Acre / RS
  [-34.7933, 5.2722]    // Nordeste: Paraíba / Roraima
];

export default function MapComponent({ selectedCity, onSelectCity, onResetBrasil, ufFilter, regFilter, classFilter }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);
  const hoveredCityIdRef = useRef(null);
  const [mapLoading, setMapLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

  const hasFilter = Boolean(
    selectedCity ||
    (regFilter && regFilter !== 'Todas as Regiões') ||
    (ufFilter && ufFilter !== 'Todas as UFs')
  );

  // ResizeObserver para manter mapa responsivo e alinhado
  useEffect(() => {
    if (!mapContainer.current) return;
    const ro = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    });
    ro.observe(mapContainer.current);
    return () => ro.disconnect();
  }, []);

  // Inicializar mapa
  useEffect(() => {
    if (mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      bounds: BRAZIL_BOUNDS,
      fitBoundsOptions: {
        padding: { top: 16, bottom: 20, left: 16, right: 16 }
      },
      pitch: 0,
      attributionControl: false
    });

    class ResetZoomControl {
      onAdd(mapInstance) {
        this._map = mapInstance;
        this._container = document.createElement('div');
        this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'maplibregl-ctrl-reset-brazil';
        button.title = 'Retornar ao enquadramento do Brasil inteiro';
        button.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="margin: auto; display: block;">
            <path d="M 3.0 8.9 L 3.5 7.8 L 4.9 7.4 L 4.9 4.7 L 6.0 4.4 L 6.5 5.1 L 7.0 5.0 L 7.8 4.4 L 7.2 3.5 L 8.1 3.8 L 9.3 3.0 L 10.0 4.9 L 11.3 4.3 L 12.7 4.4 L 13.3 3.4 L 14.0 5.3 L 16.4 6.1 L 16.7 6.6 L 18.7 6.8 L 20.7 7.8 L 21.0 8.7 L 20.8 9.7 L 19.1 11.5 L 19.0 13.6 L 18.2 15.6 L 15.0 16.9 L 14.6 18.6 L 13.7 19.7 L 12.5 21.0 L 12.2 20.2 L 10.5 19.3 L 12.3 17.5 L 11.3 15.7 L 10.3 15.6 L 10.5 13.8 L 10.2 13.0 L 9.3 12.9 L 9.2 11.8 L 7.1 11.0 L 6.9 10.0 L 4.5 10.5 L 4.5 9.9 L 3.4 9.8 L 3.0 8.9 Z"></path>
          </svg>
        `;
        button.onclick = () => {
          if (onResetBrasil) {
            onResetBrasil();
          } else {
            onSelectCity(null);
          }
          mapInstance.fitBounds(BRAZIL_BOUNDS, {
            padding: { top: 16, bottom: 20, left: 16, right: 16 },
            duration: 800
          });
        };
        this._container.appendChild(button);
        return this._container;
      }
      onRemove() {
        if (this._container && this._container.parentNode) {
          this._container.parentNode.removeChild(this._container);
        }
        this._map = undefined;
      }
    }

    map.addControl(new ResetZoomControl(), 'bottom-right');
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    
    // Popup sem moldura branca e com posicionamento customizado
    popupRef.current = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 14,
      className: 'dark-glass-popup'
    });

    map.on('error', (e) => {
      console.warn('MapLibre aviso:', e);
    });

    map.on('load', () => {
      // Forçar resize e enquadramento completo do Brasil
      map.resize();
      map.fitBounds(BRAZIL_BOUNDS, {
        padding: { top: 16, bottom: 20, left: 16, right: 16 },
        duration: 0
      });

      // Carregar em paralelo municípios e limites dos estados (UFs)
      Promise.all([
        fetch('/data/municipios_geo.json').then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        }),
        fetch('/data/estados_geo.json').then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
      ])
        .then(([muniGeo, estadosGeo]) => {
          if (!mapRef.current) return;

          // 1. Adicionar Source dos Municípios
          map.addSource('municipios', {
            type: 'geojson',
            data: muniGeo,
            generateId: false,
            promoteId: 'id'
          });

          // 2. Adicionar Source dos Estados (UFs)
          map.addSource('estados', {
            type: 'geojson',
            data: estadosGeo
          });

          // 3. Camada de preenchimento dos municípios
          map.addLayer({
            id: 'municipios-fill',
            type: 'fill',
            source: 'municipios',
            paint: {
              'fill-color': [
                'case',
                ['==', ['get', 'mais_boi'], 1],
                '#F59E0B', // Âmbar para Mais Boi que Gente
                '#10B981'  // Esmeralda para Mais Gente que Boi
              ],
              'fill-opacity': 0.86
            }
          });

          // 4. Camada de destaque suave (hover fill) usando feature-state (GPU direto, 0ms lag)
          map.addLayer({
            id: 'municipios-hover-fill',
            type: 'fill',
            source: 'municipios',
            paint: {
              'fill-color': '#FFFFFF',
              'fill-opacity': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                0.24,
                0.0
              ]
            }
          });

          // 5. Linhas de contorno branco dos municípios
          map.addLayer({
            id: 'municipios-line',
            type: 'line',
            source: 'municipios',
            paint: {
              'line-color': '#FFFFFF',
              'line-width': 0.5,
              'line-opacity': 0.35
            }
          });

          // 6. Linha de destaque suave (hover line) usando feature-state (GPU direto, 0ms lag)
          map.addLayer({
            id: 'municipios-hover-line',
            type: 'line',
            source: 'municipios',
            paint: {
              'line-color': '#FFFFFF',
              'line-width': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                2.0,
                0.0
              ],
              'line-opacity': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                0.95,
                0.0
              ]
            }
          });

          // 7. Limites dos Estados (UFs) - contorno branco forte
          map.addLayer({
            id: 'estados-line',
            type: 'line',
            source: 'estados',
            paint: {
              'line-color': '#FFFFFF',
              'line-width': 1.8,
              'line-opacity': 0.85
            }
          });

          // 8. Linha de destaque para cidade selecionada
          map.addLayer({
            id: 'municipios-highlight',
            type: 'line',
            source: 'municipios',
            filter: ['==', ['get', 'id'], 0],
            paint: {
              'line-color': '#FFFFFF',
              'line-width': 2.8,
              'line-opacity': 1.0
            }
          });

          // Função para limpar hover de forma segura e instantânea
          const clearHover = () => {
            if (hoveredCityIdRef.current !== null) {
              map.setFeatureState({ source: 'municipios', id: hoveredCityIdRef.current }, { hover: false });
              hoveredCityIdRef.current = null;
            }
            if (popupRef.current) {
              popupRef.current.remove();
            }
          };

          // Tooltip e Highlight instantâneo no hover (via feature-state)
          map.on('mousemove', 'municipios-fill', (e) => {
            if (!e.features || e.features.length === 0) return;
            map.getCanvas().style.cursor = 'pointer';

            const f = e.features[0];
            const p = f.properties;
            const cid = Number(p.id);

            // Se o mouse continua no mesmo município, apenas atualiza a posição do popup (sem refazer DOM nem GPU)
            if (hoveredCityIdRef.current === cid) {
              popupRef.current.setLngLat(e.lngLat);
              return;
            }

            // Desativa o município anterior instantaneamente
            if (hoveredCityIdRef.current !== null) {
              map.setFeatureState({ source: 'municipios', id: hoveredCityIdRef.current }, { hover: false });
            }

            // Ativa o novo município instantaneamente no shader da GPU (0ms de atraso)
            hoveredCityIdRef.current = cid;
            map.setFeatureState({ source: 'municipios', id: cid }, { hover: true });

            const temMaisBoi = Number(p.mais_boi) === 1;
            const corRazao = temMaisBoi ? '#F59E0B' : '#10B981';
            const html = `
              <div class="custom-map-tooltip">
                <div class="tooltip-header">${p.name} (${p.uf})</div>
                <div class="tooltip-badge ${temMaisBoi ? 'badge-boi' : 'badge-gente'}">
                  ${temMaisBoi ? '🐂 Mais Boi que Gente' : '👥 Mais Gente que Boi'}
                </div>
                <div class="tooltip-row">
                  <span>Bois:</span>
                  <strong style="color: #F59E0B;">${Number(p.bov || 0).toLocaleString('pt-BR')}</strong>
                </div>
                <div class="tooltip-row">
                  <span>Pessoas:</span>
                  <strong style="color: #10B981;">${Number(p.pop || 0).toLocaleString('pt-BR')}</strong>
                </div>
                <div class="tooltip-footer">
                  Razão: <strong style="color: ${corRazao};">${Number(p.razao || 0).toFixed(2).replace('.', ',')}</strong> bois por pessoa
                </div>
              </div>
            `;

            popupRef.current.setLngLat(e.lngLat).setHTML(html).addTo(map);
          });

          map.on('mouseleave', 'municipios-fill', () => {
            map.getCanvas().style.cursor = '';
            clearHover();
          });

          // Garantir limpeza se o cursor sair da tela do mapa
          map.getCanvas().addEventListener('mouseleave', () => {
            map.getCanvas().style.cursor = '';
            clearHover();
          });

          // Clique no polígono seleciona o município
          map.on('click', 'municipios-fill', (e) => {
            if (!e.features || e.features.length === 0) return;
            clearHover();
            const f = e.features[0];
            const p = f.properties;
            onSelectCity({
              id: Number(p.id),
              name: p.name,
              uf: p.uf,
              reg: p.reg,
              lat: Number(p.lat),
              lon: Number(p.lon),
              bov: Number(p.bov),
              pop: Number(p.pop),
              razao: Number(p.razao),
              mais_boi: Number(p.mais_boi),
              bbox: p.bbox
            });
          });

          setDataLoaded(true);
          setMapLoading(false);
        })
        .catch(err => {
          console.error('Erro ao baixar geometrias:', err);
          setMapLoading(false);
        });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Reagir a mudanças de filtros e seleção de cidade
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !dataLoaded || !map.getSource('municipios')) return;

    // Limpar qualquer hover ativo ao trocar filtros ou selecionar cidade
    if (hoveredCityIdRef.current !== null) {
      try {
        map.setFeatureState({ source: 'municipios', id: hoveredCityIdRef.current }, { hover: false });
      } catch (err) {}
      hoveredCityIdRef.current = null;
    }
    if (popupRef.current) {
      popupRef.current.remove();
    }

    // Caso 1: Cidade específica selecionada -> Filtrar e enquadrar a cidade inteira (fitBounds)
    if (selectedCity) {
      const cityId = Number(selectedCity.id);
      map.setFilter('municipios-fill', ['==', ['get', 'id'], cityId]);
      map.setFilter('municipios-line', ['==', ['get', 'id'], cityId]);
      map.setFilter('municipios-highlight', ['==', ['get', 'id'], cityId]);
      map.setFilter('municipios-hover-fill', ['==', ['get', 'id'], cityId]);
      map.setFilter('municipios-hover-line', ['==', ['get', 'id'], cityId]);

      // Enquadramento dinâmico do município como um todo (evita cortar cidades grandes)
      if (selectedCity.bbox && selectedCity.bbox.length === 4) {
        map.fitBounds([
          [selectedCity.bbox[0], selectedCity.bbox[1]],
          [selectedCity.bbox[2], selectedCity.bbox[3]]
        ], {
          padding: { top: 55, bottom: 55, left: 55, right: 55 },
          maxZoom: 10.5,
          duration: 900
        });
      } else if (selectedCity.lon && selectedCity.lat) {
        map.flyTo({
          center: [selectedCity.lon, selectedCity.lat],
          zoom: 8.5,
          duration: 900
        });
      }
      return;
    }

    // Caso 2: Brasil / Visão Geral (ou filtrada por Região/UF/Classificação)
    map.setFilter('municipios-highlight', ['==', ['get', 'id'], 0]);

    const filterExpressions = ['all'];

    if (ufFilter && ufFilter !== 'Todas as UFs') {
      filterExpressions.push(['==', ['get', 'uf'], ufFilter]);
    }
    if (regFilter && regFilter !== 'Todas as Regiões') {
      filterExpressions.push(['==', ['get', 'reg'], regFilter]);
    }
    if (classFilter === 'mais_boi') {
      filterExpressions.push(['==', ['get', 'mais_boi'], 1]);
    } else if (classFilter === 'mais_pessoas') {
      filterExpressions.push(['==', ['get', 'mais_boi'], 0]);
    }

    const finalFilter = filterExpressions.length > 1 ? filterExpressions : null;
    map.setFilter('municipios-fill', finalFilter);
    map.setFilter('municipios-line', finalFilter);
    map.setFilter('municipios-hover-fill', finalFilter);
    map.setFilter('municipios-hover-line', finalFilter);

    // Ajustar zoom e câmera conforme recorte exato da UF ou Região
    if (ufFilter && ufFilter !== 'Todas as UFs' && UF_BOUNDS[ufFilter]) {
      map.fitBounds(UF_BOUNDS[ufFilter], {
        padding: { top: 45, bottom: 45, left: 45, right: 45 },
        duration: 800
      });
    } else if (regFilter && regFilter !== 'Todas as Regiões' && REG_BOUNDS[regFilter]) {
      map.fitBounds(REG_BOUNDS[regFilter], {
        padding: { top: 45, bottom: 45, left: 45, right: 45 },
        duration: 800
      });
    } else {
      map.fitBounds(BRAZIL_BOUNDS, {
        padding: { top: 16, bottom: 20, left: 16, right: 16 },
        duration: 800
      });
    }
  }, [selectedCity, ufFilter, regFilter, classFilter, dataLoaded]);

  return (
    <div className="map-container" style={{ position: 'relative' }}>
      {mapLoading && (
        <div className="map-loading-overlay">
          <div className="spinner" />
          <div className="loading-text">
            Carregando malha municipal do Brasil...
          </div>
        </div>
      )}

      {/* Botão Brasil posicionado no limite superior direito dentro do mapa */}
      {hasFilter && (
        <button
          className="map-btn-brasil-corner"
          onClick={onResetBrasil || (() => onSelectCity(null))}
          title="Retornar à visão consolidada do Brasil"
        >
          <ArrowLeft size={14} /> Brasil
        </button>
      )}

      {/* Legenda em coluna única com duas linhas */}
      <div className="map-legend-overlay">
        <div className="legend-swatch">
          <div className="swatch-color" style={{ background: '#F59E0B' }} />
          <span>Mais Boi que Gente</span>
        </div>
        <div className="legend-swatch">
          <div className="swatch-color" style={{ background: '#10B981' }} />
          <span>Mais Gente que Boi</span>
        </div>
      </div>

      <div ref={mapContainer} className="maplibre-wrapper" />
    </div>
  );
}

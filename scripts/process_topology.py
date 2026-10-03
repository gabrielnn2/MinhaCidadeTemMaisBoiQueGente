import json
import time
from shapely.geometry import shape, mapping
from shapely.validation import make_valid
import topojson as tp

print("=== 1. Processando Municípios com Topologia e Reparação Geométrica ===")
t0 = time.time()

# Carregar dados processados consolidados
with open('spa/public/data/dados_brasil.json', 'r', encoding='utf-8') as f:
    brasil_data = json.load(f)

city_data_map = {m['id']: m for m in brasil_data['municipios']}
print(f"Carregados {len(city_data_map)} municípios de dados_brasil.json")

# Carregar malha original bruta dos municípios
with open('3_Dados_Processados/municipios_poligonos.json', 'r', encoding='utf-8') as f:
    raw_muni = json.load(f)

print(f"Carregadas {len(raw_muni['features'])} features originais de municipios_poligonos.json")

# Corrigir todas as geometrias e preparar para TopoJSON
valid_features = []
repaired_count = 0

for feat in raw_muni['features']:
    props = feat['properties']
    cid = int(props['id'])
    meta = city_data_map.get(cid)
    
    s = shape(feat['geometry'])
    if not s.is_valid:
        s = make_valid(s)
        repaired_count += 1
    
    # Calcular Bounding Box [min_lon, min_lat, max_lon, max_lat]
    bounds = [round(b, 4) for b in s.bounds]
    
    # Atualizar dados do município com o bbox
    if meta:
        meta['bbox'] = bounds
    
    geom_m = mapping(s)
    
    valid_features.append({
        'type': 'Feature',
        'id': cid,
        'properties': {
            'id': cid,
            'name': meta['name'] if meta else props.get('name', ''),
            'uf': meta['uf'] if meta else '',
            'reg': meta['reg'] if meta else '',
            'bov': meta['bov'] if meta else 0,
            'pop': meta['pop'] if meta else 0,
            'razao': meta['razao'] if meta else 0.0,
            'mais_boi': meta['mais_boi'] if meta else 0,
            'lat': meta['lat'] if meta else 0.0,
            'lon': meta['lon'] if meta else 0.0,
            'bbox': bounds
        },
        'geometry': geom_m
    })

print(f"Geometrias reparadas (como Mineiros e cidades costeiras/ilhas): {repaired_count}")

# Aplicar simplificação topológica compartilhada com TopoJSON
print("Extraindo e simplificando topologia com TopoJSON (elimina gaps, slivers e sobreposições)...")
topo = tp.Topology(
    {'type': 'FeatureCollection', 'features': valid_features},
    topology=True,
    prequantize=False
)
# epsilon=0.0025 (~250m na linha do Equador) preserva contornos fieis sem estourar o tamanho
simplified_topo = topo.toposimplify(epsilon=0.0022)
geojson_out = json.loads(simplified_topo.to_geojson())

# Garantir 4 casas decimais nas coordenadas
def round_coords(coords):
    if not coords:
        return coords
    if isinstance(coords[0], (int, float)):
        return [round(coords[0], 4), round(coords[1], 4)]
    return [round_coords(c) for c in coords]

for feat in geojson_out['features']:
    feat['geometry']['coordinates'] = round_coords(feat['geometry']['coordinates'])

# Salvar GeoJSON dos municípios
out_muni_path = 'spa/public/data/municipios_geo.json'
with open(out_muni_path, 'w', encoding='utf-8') as f:
    json.dump(geojson_out, f, separators=(',', ':'))

print(f"Salvo municipios_geo.json ({len(geojson_out['features'])} features) em {time.time()-t0:.1f}s")

# Atualizar dados_brasil.json com os bboxes
with open('spa/public/data/dados_brasil.json', 'w', encoding='utf-8') as f:
    json.dump(brasil_data, f, separators=(',', ':'))
print("Salvo dados_brasil.json com bbox para todos os municípios")

# === 2. Processando Limites dos Estados (UFs) ===
print("\n=== 2. Processando Limites dos Estados (UFs) ===")
with open('3_Dados_Processados/brasil_uf.json', 'r', encoding='utf-8') as f:
    raw_uf = json.load(f)

uf_features = []
for feat in raw_uf['features']:
    s = shape(feat['geometry'])
    if not s.is_valid:
        s = make_valid(s)
    props = feat['properties']
    uf_code = props.get('UF_05', '')
    uf_name = props.get('NOME_UF', '')
    uf_features.append({
        'type': 'Feature',
        'id': uf_code,
        'properties': {'uf': uf_code, 'name': uf_name},
        'geometry': mapping(s)
    })

topo_uf = tp.Topology(
    {'type': 'FeatureCollection', 'features': uf_features},
    topology=True,
    prequantize=False
)
simp_uf = topo_uf.toposimplify(epsilon=0.003)
geojson_uf = json.loads(simp_uf.to_geojson())

for feat in geojson_uf['features']:
    feat['geometry']['coordinates'] = round_coords(feat['geometry']['coordinates'])

out_uf_path = 'spa/public/data/estados_geo.json'
with open(out_uf_path, 'w', encoding='utf-8') as f:
    json.dump(geojson_uf, f, separators=(',', ':'))

print(f"Salvo estados_geo.json ({len(geojson_uf['features'])} estados)")
print("=== Processamento concluído com sucesso! ===")

import json
import os
import pandas as pd

print("=== Exportando dados consolidados para o Frontend ===")
df = pd.read_parquet('3_Dados_Processados/base_completa.parquet')
print('Anos:', sorted(df['ANO'].unique()))
print('Total de municípios:', df['CO_MUNICIPIO'].nunique())

# 1. Resumo municipal para o ano padrão (2025)
df2025 = df[df['ANO'] == 2025].copy()
mun_summary = []
for _, r in df2025.iterrows():
    lat = float(r['LATITUDE']) if pd.notna(r['LATITUDE']) else 0.0
    lon = float(r['LONGITUDE']) if pd.notna(r['LONGITUDE']) else 0.0
    mun_summary.append({
        'id': int(r['CO_MUNICIPIO']),
        'name': r['NM_MUNICIPIO'],
        'uf': r['SG_UF'],
        'uf_nome': r['NM_UF'] if pd.notna(r['NM_UF']) else r['SG_UF'],
        'reg': r['NM_REGIAO'] if pd.notna(r['NM_REGIAO']) else '',
        'lat': round(lat, 4),
        'lon': round(lon, 4),
        'bov': int(r['BOVINO']),
        'pop': int(r['POPULACAO']),
        'razao': round(float(r['RAZAO']), 2),
        'mais_boi': int(r['MAIS_BOI'])
    })

# 2. Histórico nacional (2000-2026)
br_hist = df.groupby('ANO').agg(
    bov=('BOVINO', 'sum'),
    pop=('POPULACAO', 'sum'),
    mun_boi=('MAIS_BOI', 'sum'),
    total_mun=('CO_MUNICIPIO', 'count')
).reset_index().to_dict(orient='records')

# 3. Séries temporais compactadas por município
anos = sorted(df['ANO'].unique())
pivot_bov = df.pivot(index='CO_MUNICIPIO', columns='ANO', values='BOVINO').fillna(0).astype(int)
pivot_pop = df.pivot(index='CO_MUNICIPIO', columns='ANO', values='POPULACAO').fillna(0).astype(int)

mun_history = {}
for cid in pivot_bov.index:
    mun_history[int(cid)] = {
        'b': pivot_bov.loc[cid].tolist(),
        'p': pivot_pop.loc[cid].tolist()
    }

print(f'Municípios no resumo: {len(mun_summary)}')
print(f'Anos históricos Brasil: {len(br_hist)}')
print(f'Municípios no histórico: {len(mun_history)}')

data_payload = {
    'anos': [int(a) for a in anos],
    'ano_padrao': 2025,
    'br_hist': br_hist,
    'municipios': mun_summary,
    'historico_municipios': mun_history
}

os.makedirs('frontend_data', exist_ok=True)
with open('frontend_data/dados_brasil.json', 'w', encoding='utf-8') as f:
    json.dump(data_payload, f, ensure_ascii=False)

os.makedirs('spa/public/data', exist_ok=True)
with open('spa/public/data/dados_brasil.json', 'w', encoding='utf-8') as f:
    json.dump(data_payload, f, ensure_ascii=False)

print("Exportação concluída com sucesso para frontend_data/ e spa/public/data/!")

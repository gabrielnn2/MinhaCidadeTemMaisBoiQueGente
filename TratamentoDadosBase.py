# %%
import os
import pandas as pd
import numpy as np

def consolidar_base():
    print("Iniciando consolidação da base integrada (Bovinos + População + Municípios)...")
    bovinos = pd.read_csv("3_Dados_Processados/bovinos.csv")
    populacao = pd.read_csv("3_Dados_Processados/populacao.csv")
    municipios = pd.read_csv("3_Dados_Processados/municipios.csv")

    bovinos['CO_MUNICIPIO'] = bovinos['CO_MUNICIPIO'].astype('int64')
    bovinos['ANO'] = bovinos['ANO'].astype('int64')
    bovinos['BOVINO'] = bovinos['BOVINO'].fillna(0).astype('int64')

    populacao['CO_MUNICIPIO'] = populacao['CO_MUNICIPIO'].astype('int64')
    populacao['ANO'] = populacao['ANO'].astype('int64')
    populacao['POPULACAO'] = populacao['POPULACAO'].fillna(0).astype('int64')

    municipios['CO_MUNICIPIO'] = municipios['CO_MUNICIPIO'].astype('int64')

    # Merge populacao e bovinos (left join preserva municípios 100% urbanos sem rebanho bovino)
    df = pd.merge(populacao, bovinos, on=["CO_MUNICIPIO", "ANO"], how="left")
    df['BOVINO'] = df['BOVINO'].fillna(0).astype('int64')
    
    # Merge com dados cadastrais e geográficos dos municípios
    df = pd.merge(df, municipios, on=["CO_MUNICIPIO"], how="left")

    # Cálculos analíticos
    df['DIFERENCA'] = df['BOVINO'] - df['POPULACAO']
    df['RAZAO'] = np.where(df['POPULACAO'] > 0, (df['BOVINO'] / df['POPULACAO']).round(2), 0.0)
    df['MAIS_BOI'] = (df['BOVINO'] > df['POPULACAO']).astype(int)
    df['CATEGORIA'] = np.where(df['BOVINO'] > df['POPULACAO'], "Mais Boi que Gente", "Mais Gente que Boi")

    # Ordenação
    df = df.sort_values(['ANO', 'NM_REGIAO', 'SG_UF', 'NM_MUNICIPIO']).reset_index(drop=True)

    # Salvar formatos otimizados
    df.to_parquet("3_Dados_Processados/base_completa.parquet", index=False)
    df.to_csv("3_Dados_Processados/base_completa.csv", index=False, encoding="utf-8")
    
    print(f"Base consolidada com sucesso: {len(df)} registros. Anos: {sorted(df['ANO'].unique())}")
    return df

def load_data():
    parquet_path = "3_Dados_Processados/base_completa.parquet"
    csv_path = "3_Dados_Processados/base_completa.csv"
    if os.path.exists(parquet_path):
        return pd.read_parquet(parquet_path)
    elif os.path.exists(csv_path):
        return pd.read_csv(csv_path)
    else:
        return consolidar_base()

if __name__ == "__main__":
    consolidar_base()
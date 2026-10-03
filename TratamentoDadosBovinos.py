# %%
import glob
import os
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression

def processar_bovinos():
    print("Iniciando processamento da Tabela 3939 (Bovinos)...")
    bovinos_pasta = '1_Dados_Recebidos/tabela3939'
    bovinos_arquivos = sorted(glob.glob(os.path.join(bovinos_pasta, '*.xlsx')))
    
    tabelas = []
    for arquivo in bovinos_arquivos:
        ano = int(os.path.basename(arquivo)[:4])
        # Consideramos dados de 2000 em diante para compatibilidade com censo e estimativas
        if ano >= 2000:
            df = pd.read_excel(arquivo, skiprows=4, na_values=["-", "..."])
            col0 = pd.to_numeric(df.iloc[:, 0], errors='coerce')
            bov_col = pd.to_numeric(df['Bovino'], errors='coerce').fillna(0)
            
            sub = pd.DataFrame({
                'CO_MUNICIPIO': col0,
                'BOVINO': bov_col,
                'ANO': ano
            })
            sub = sub.dropna(subset=['CO_MUNICIPIO'])
            sub = sub[sub['CO_MUNICIPIO'] >= 1000000]
            sub['CO_MUNICIPIO'] = sub['CO_MUNICIPIO'].astype('int64')
            sub['BOVINO'] = sub['BOVINO'].round(0).astype('int64')
            tabelas.append(sub)
            
    bovinos = pd.concat(tabelas, ignore_index=True)
    print(f"Bovinos reais carregados: anos {sorted(bovinos['ANO'].unique())}, total registros: {len(bovinos)}")

    # Salva dados tratados históricos reais
    os.makedirs("2_Dados_Tratados", exist_ok=True)
    os.makedirs("3_Dados_Processados", exist_ok=True)
    bovinos.to_csv("2_Dados_Tratados/bovinos.csv", index=False)

    # Caso queira projetar 2026 para parear com a estimativa populacional de 2026:
    max_ano = bovinos['ANO'].max()
    if max_ano == 2025:
        print("Projetando bovinos para 2026 com base nos anos recentes (2018-2025)...")
        bov_recent = bovinos[bovinos["ANO"] >= 2018]
        proj_2026 = []
        for mun, sub in bov_recent.groupby("CO_MUNICIPIO"):
            if len(sub) >= 3:
                X = sub["ANO"].values.reshape(-1, 1)
                y = sub["BOVINO"].values
                model = LinearRegression()
                model.fit(X, y)
                y_pred = max(0, model.predict([[2026]])[0])
            else:
                y_pred = sub["BOVINO"].iloc[-1]
            proj_2026.append([mun, int(round(y_pred)), 2026])
        df_2026 = pd.DataFrame(proj_2026, columns=["CO_MUNICIPIO", "BOVINO", "ANO"])
        bovinos_completo = pd.concat([bovinos, df_2026], ignore_index=True)
    else:
        bovinos_completo = bovinos

    bovinos_completo = bovinos_completo.sort_values(['CO_MUNICIPIO', 'ANO']).reset_index(drop=True)
    bovinos_completo.to_csv("3_Dados_Processados/bovinos.csv", index=False)
    print(f"Sucesso: bovinos.csv gravado em 3_Dados_Processados com anos {sorted(bovinos_completo['ANO'].unique())}")
    return bovinos_completo

if __name__ == "__main__":
    processar_bovinos()

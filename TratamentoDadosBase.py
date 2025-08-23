import pandas as pd

def load_data():
    bovinos = pd.read_csv("bovinos.csv")
    populacao = pd.read_csv("populacao.csv")
    municipios = pd.read_csv("municipios.csv")

    bovinos = bovinos.astype('Int64')
    populacao = populacao.astype('Int64')

    df = pd.merge(bovinos, populacao, on=["CO_MUNICIPIO", "ANO"], how="outer")
    df = pd.merge(df, municipios, on=["CO_MUNICIPIO"], how="left")

    #df.to_excel('3_Dados_Processados/base_completa.xlsx', index=False)

    return(df)
import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
import plotly.express as px

from TratamentoDadosBase import load_data

st.title("Minha cidade tem mais boi que gente?")

df = load_data()

# --------------------------
# Escolha do nível de análise
# --------------------------
nivel = st.radio("Escolha o nível de visualização:", ["Município", "Unidade Federativa", "Região", "Brasil"])

# --------------------------
# Caso Município
# --------------------------
if nivel == "Município":
    uf_escolhida = st.selectbox("Selecione a Unidade Federativa:", sorted(df["NM_UF"].unique()))
    municipios = df[df["NM_UF"] == uf_escolhida]["NM_MUNICIPIO"].unique()
    municipio = st.selectbox("Selecione o Município:", sorted(municipios))

    df_filtrado = df[df["NM_MUNICIPIO"] == municipio]

    fig = px.line(
        df_filtrado,
        x="ANO",
        y=["BOVINO", "POPULACAO"],
        markers=True,
        title=f"Município: {municipio} ({uf_escolhida})"
    )
    fig.update_traces(hovertemplate="Ano: %{x}<br>Valor: %{y}")

    st.plotly_chart(fig, use_container_width=True)

# --------------------------
# Caso UF
# --------------------------
elif nivel == "Unidade Federativa":
    uf_escolhida = st.selectbox("Selecione a Unidade Federativa:", sorted(df["NM_UF"].unique()))

    df_uf = df[df["NM_UF"] == uf_escolhida].groupby("ANO", as_index=False)[["BOVINO", "POPULACAO"]].sum()

    fig = px.line(
        df_uf,
        x="ANO",
        y=["BOVINO", "POPULACAO"],
        markers=True,
        title=f"Agregado por UF: {uf_escolhida}"
    )
    fig.update_traces(hovertemplate="Ano: %{x}<br>Valor: %{y}")

    st.plotly_chart(fig, use_container_width=True)

# --------------------------
# Caso Região
# --------------------------
elif nivel == "Região":
    regiao = st.selectbox("Selecione a Região:", sorted(df["NM_REGIAO"].unique()))

    df_regiao = df[df["NM_REGIAO"] == regiao].groupby("ANO", as_index=False)[["BOVINO", "POPULACAO"]].sum()

    fig = px.line(
        df_regiao,
        x="ANO",
        y=["BOVINO", "POPULACAO"],
        markers=True,
        title=f"Agregado por Região: {regiao}"
    )
    fig.update_traces(hovertemplate="Ano: %{x}<br>Valor: %{y}")

    st.plotly_chart(fig, use_container_width=True)

# --------------------------
# Caso Brasil
# --------------------------
else:
    df_brasil = df.groupby("ANO", as_index=False)[["BOVINO", "POPULACAO"]].sum()

    fig = px.line(
        df_brasil,
        x="ANO",
        y=["BOVINO", "POPULACAO"],
        markers=True,
        title=f"Agregado no nível Brasil"
    )
    fig.update_traces(hovertemplate="Ano: %{x}<br>Valor: %{y}")

    st.plotly_chart(fig, use_container_width=True)
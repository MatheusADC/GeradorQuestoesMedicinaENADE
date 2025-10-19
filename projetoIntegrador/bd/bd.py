import sqlite3

with sqlite3.connect("questoes.db") as conn:
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS questoes_objetivas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numero_questao INTEGER,
        ano INTEGER,
        especialidade TEXT,
        dificuldade TEXT,
        enunciado TEXT,
        alternativas TEXT,
        resposta_correta TEXT
    )
    """)

# --- Questão 2 ---
enunciado1 = """O crescimento das cidades promove o aumento da demanda por serviços de água tratada,
esgotamento sanitário, manejo das águas pluviais, limpeza urbana e coleta de resíduos
sólidos. No Brasil, o processo de urbanização ocorreu de forma rápida e desigual, o que
resultou no agravamento de injustiças sociais e econômicas. Os serviços de saneamento básico,
considerados direitos humanos fundamentais, não são acessíveis a uma parcela significativa
da população, principalmente àquela em que se concentram os segmentos populacionais em
situação de vulnerabilidade.
O atendimento integral e universalizado junto às populações periféricas e em situação de
vulnerabilidade constitui um grande desafio, por demandar políticas públicas e investimentos
subsidiados e permanentes.
Acerca do saneamento básico no Brasil, avalie as afirmações a seguir.
I. A grave desigualdade social, evidenciada pela segregação nos espaços urbanos, é uma das
barreiras para a universalização do acesso aos serviços de saneamento básico.
II. O serviço de abastecimento de água no Brasil situa-se no mesmo patamar de
fornecimento e de infraestrutura que o sistema de coleta e tratamento do esgoto.
III. A universalização do acesso aos serviços de saneamento básico requer investimentos
em políticas públicas e em tecnologias sociais que priorizem a democratização e o
atendimento às populações em situação de vulnerabilidade.
IV. O aumento da incidência de doenças transmitidas pela água resulta não somente da
inadequação dos serviços de saneamento, mas também da precariedade das condições
de moradia da população em situação de vulnerabilidade.
É correto apenas o que se afirma em"""

alternativas1 = """I e II.;
I e IV.;
II e III.;
I, III e IV.;
II, III e IV."""

cursor.execute("""
INSERT INTO questoes_objetivas (
    numero_questao, ano, especialidade, dificuldade, enunciado, alternativas, resposta_correta
) VALUES (?, ?, ?, ?, ?, ?, ?)
""", (
    2,
    2023,
    "Saúde Coletiva",
    "easy",
    enunciado1,
    alternativas1,
    "I, III e IV."
))

# --- Questão 1 ---
enunciado2 = """A fome e a insegurança alimentar, antigos problemas da sociedade, 
são agravados em regiões com elevados índices de desigualdade social. 
Propor soluções para esse quadro requer uma abordagem multidimensional, 
que possibilite a interação entre as dimensões sociais, culturais, políticas, 
econômicas e ambientais envolvidas na produção e na distribuição de alimentos. 
Considerando o texto e as imagens apresentados, avalie as asserções a seguir e a relação proposta entre elas.
I. A fome no mundo é um fenômeno biológico e sociológico inevitável.
PORQUE
II. A disponibilidade desigual de alimentos, o acirramento de conflitos geopolíticos,
a formação de cadeias agrícolas globais e o aumento das catástrofes climáticas são
fatores que impactam a segurança alimentar de um grande número de populações.
A respeito dessas asserções, assinale a opção correta."""

alternativas2 = """As asserções I e II são proposições verdadeiras, e a II é uma justificativa correta da I.;
As asserções I e II são proposições verdadeiras, mas a II não é uma justificativa correta da I.;
A asserção I é uma proposição verdadeira, e a II é uma proposição falsa.;
A asserção I é uma proposição falsa, e a II é uma proposição verdadeira.;
As asserções I e II são proposições falsas."""

cursor.execute("""
INSERT INTO questoes_objetivas (
    numero_questao, ano, especialidade, dificuldade, enunciado, alternativas, resposta_correta
) VALUES (?, ?, ?, ?, ?, ?, ?)
""", (
    1,
    2023,
    "Saúde Coletiva",
    "easy",
    enunciado2,
    alternativas2,
    "A asserção I é uma proposição falsa, e a II é uma proposição verdadeira."
))

conn.commit()
conn.close()
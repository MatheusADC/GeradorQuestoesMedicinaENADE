# <img src="https://github.com/user-attachments/assets/caabfdf0-0f9e-44a3-8200-c6579fe87887" alt="Ícone de descrição" width="28"> Descrição

O projeto visa a criação de **questões** de medicina modelo ENADE mediante solicitação do usuário, uso de agentes e interação com o LM Studio.

# <sub><img src="https://img.icons8.com/?size=100&id=115336&format=png&color=000000" alt="Ícone de engrenagem" width="34"></sub> Execução do Projeto

### Inicialização do servidor do _front-end_

> [!TIP]
> Use a extensão **live server** do VSCode.

### Instalação das bibliotecas

```
pip install -r requirements.txt
```

### Variáveis de ambiente

Defina uma chave para assinar os tokens JWT antes de subir o Flask (Ex.: PowerShell):

```
$Env:JWT_SECRET="uma-chave-secreta-bem-grande"
```

> Use o mesmo terminal para iniciar o servidor ou exporte a variável de acordo com seu SO.

### Inicialização do servidor do _back-end_ (Flask)

```
python server.py
```

> [!WARNING]  
> O comando deve ser realizado dentro do diretório **\projetoIntegrador\server**.

### Instalação do LM Studio

[Clique aqui](https://lmstudio.ai/)

### Inicialização do servidor do LM Studio

> [!WARNING]  
> A opção fica no menu lateral, na aba **Developer**.

## Autenticação e usuários

- **Cadastro**: o formulário "Cadastro de Médico" agora envia `nome`, `email` e `senha` para `POST /register`. A senha é armazenada com hash dentro de `usuarios.db`.
- **Login**: o formulário de login chama `POST /login`, que devolve um JWT (`Authorization: Bearer ...`). O token é guardado no `localStorage` do navegador e enviado automaticamente para rotas protegidas.
- **Sessão**: ao recarregar a página usamos `GET /me` para validar o token antes de mostrar o dashboard.
- **Proteção**: o endpoint `POST /gerar_questao` exige JWT válido, garantindo que apenas usuários autenticados consigam gerar questões com a IA.

### Endpoints principais

| Método | Rota             | Corpo                                                                          | Descrição                                                                    |
| ------ | ---------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `POST` | `/register`      | `{ "name": "Dr. Ana", "email": "ana@exemplo.com", "password": "senha123" }`    | Cria usuário em `usuarios.db` e retorna `{ user, token }`.                   |
| `POST` | `/login`         | `{ "email": "ana@exemplo.com", "password": "senha123" }`                       | Valida credenciais e retorna `{ user, token }`.                              |
| `GET`  | `/me`            | —                                                                              | Retorna o usuário associado ao token enviado em `Authorization: Bearer ...`. |
| `POST` | `/gerar_questao` | `{ "especialidade": "Cardiologia", "dificuldade": "medium", "prompt": "..." }` | Gera nova questão (requer token).                                            |

# <sub><img src="https://img.icons8.com/?size=100&id=104329&format=png&color=000000" alt="Ícone de página" width="32"></sub> Páginas

| Home                                                                                                                                |
| ----------------------------------------------------------------------------------------------------------------------------------- |
| <img width="1914" height="942" alt="image" src="https://github.com/user-attachments/assets/9a883c72-1a27-4f5c-9657-23e74ffb6271" /> |

| Gerador de Questões                                                                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------- |
| <img width="1355" height="928" alt="image" src="https://github.com/user-attachments/assets/d8af5945-11d4-4882-960e-8041339691d2" /> |

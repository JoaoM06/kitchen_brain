
# 📦 Kitchen Brain – Documentação do Módulo de Inscrição Manual de Estoque (Atualizada)

O módulo de **inscrição manual de estoque** do **Kitchen Brain** permite que o usuário registre manualmente novos produtos, ingredientes e insumos sem depender de automações ou integração direta com sensores.  
Ele é essencial para cozinhas domésticas ou pequenas operações que desejam manter o controle atualizado do estoque de forma simples e direta.

---

## ⚙️ Funcionalidades
1. Inserção manual de itens com nome, categoria, quantidade e data de validade  
2. Edição de informações cadastradas  
3. Remoção de produtos obsoletos  
4. Atualização rápida de quantidades (entrada ou saída manual)  
5. Validação automática de campos obrigatórios  
6. Integração com o módulo principal de Estoque  

---

## 🔗 Endpoints da API
- **POST /estoque/manual/** — adiciona novo item manualmente  
- **GET /estoque/manual/** — lista os itens cadastrados manualmente  
- **PUT /estoque/manual/{id}** — atualiza informações de um item  
- **DELETE /estoque/manual/{id}** — remove item manual do estoque  
- **PATCH /estoque/manual/{id}/quantidade** — altera quantidade de forma rápida  

---

## 📱 Interface Mobile
- Tela de cadastro manual com campos interativos (nome, quantidade, validade)  
- Botão flutuante “Adicionar Item”  
- Validação visual em tempo real (campos obrigatórios destacados)  
- Tela de listagem com opção de edição rápida  
- Notificações locais para lembrar da atualização de estoque manual  

---

## 🧩 Tecnologias
**Back-End:** Python, FastAPI, SQLAlchemy, Pydantic  
**Front-End:** React Native, Expo, Axios, AsyncStorage, React Navigation  

---

## 🧠 Regras de Negócio
1. Todos os campos obrigatórios (nome, quantidade e validade) devem ser preenchidos antes do envio  
2. Quantidade inicial deve ser maior que zero  
3. Não é permitido cadastrar dois itens com o mesmo nome e categoria manualmente  
4. Alterações devem atualizar automaticamente o estoque geral  
5. O sistema deve registrar o histórico de alterações manuais para auditoria  

# **📦 Kitchen Brain – Documentação de Módulos**

 

## **📦 Kitchen Brain – Documentação do Módulo de Perfil (Atualizada)**

 O módulo de perfil do Kitchen Brain é responsável por gerenciar as informações do usuário, suas preferências, configurações de automação e integração com outros módulos do sistema, como estoque e receitas. Ele fornece autenticação básica e permite personalização da experiência dentro do aplicativo.

### **Funcionalidades**

·         \- Cadastro e login de usuários

·         \- Edição de informações pessoais (nome, e-mail, foto, preferências)

·         \- Configurações de notificações e idioma

·         \- Integração com o sistema de automações da cozinha

·         \- Sincronização de dados com o dispositivo móvel

·         \- Logout e limpeza de sessão local

### **Endpoints da API**

·         \- POST /perfil/ — cria novo perfil de usuário

·         \- GET /perfil/{id} — obtém dados do usuário

·         \- PUT /perfil/{id} — atualiza informações do perfil

·         \- DELETE /perfil/{id} — remove perfil

·         \- POST /login/ — autentica usuário

·         \- POST /logout/ — encerra sessão

### **Interface Mobile**

·         \- Tela inicial com informações do usuário (foto, nome, preferências)

·         \- Tela de edição de perfil com campos interativos

·         \- Tela de configurações (idioma, notificações, privacidade)

·         \- Integração com AsyncStorage para persistência local de sessão

·         \- Uso de ícones e componentes visuais do React Native Vector Icons

### **Tecnologias**

Back-End: Python, FastAPI, SQLAlchemy, Pydantic

Front-End: React Native, Expo, Axios, AsyncStorage, React Navigation

### **Regras de Negócio**

·         \- E-mail deve ser único e validado antes do cadastro

·         \- Senha deve conter pelo menos 8 caracteres

·         \- O perfil só pode ser editado pelo próprio usuário autenticado

·         \- Dados locais devem ser atualizados sempre que houver mudança no servidor

·         \- Sessões expiram automaticamente após determinado período de inatividade

 

## **📦 Kitchen Brain – Documentação do Módulo de Estoque (Atualizada)**

 O módulo de estoque do Kitchen Brain é responsável por gerenciar os ingredientes, produtos e insumos da cozinha. Ele controla entrada, saída, atualização de quantidades, alertas de validade e integração com receitas.

### **Funcionalidades**

·         \- Listagem de itens

·         \- Cadastro de novo item

·         \- Atualização de quantidade

·         \- Exclusão de itens

·         \- Alertas de validade

·         \- Integração futura com receitas

### **Endpoints da API**

·         \- GET /estoque/ — lista produtos

·         \- POST /estoque/ — adiciona item

·         \- PUT /estoque/{id} — atualiza

·         \- DELETE /estoque/{id} — remove

### **Interface Mobile**

·         \- Tela principal com status por cor

·         \- Botão flutuante para novo item

·         \- Tela de detalhes com histórico e edição

### **Tecnologias**

Back-End: Python, FastAPI, SQLAlchemy, Pydantic

Front-End: React Native, Expo, Axios, AsyncStorage

### **Regras de Negócio**

·         \- Quantidade não pode ser negativa

·         \- Nome de produto deve ser único

·         \- Itens vencidos não podem ser usados

·         \- Alerta 3 dias antes da validade
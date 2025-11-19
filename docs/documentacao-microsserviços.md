**📦 Kitchen Brain – Documentação de Módulos (Atualizada)**

Esta documentação detalha os módulos de microsserviços da plataforma Kitchen Brain, um sistema desenvolvido para gerenciar perfis de usuários, estoque de ingredientes, e um catálogo robusto de receitas.

Para uma visualização clara da comunicação entre os módulos, confira o diagrama de arquitetura: 

**📦 Kitchen Brain – Módulo de Perfil**

O módulo de perfil do Kitchen Brain é responsável por gerenciar as informações do usuário, suas preferências, configurações de automação e integração com outros módulos do sistema, como estoque e receitas. Ele fornece autenticação básica e permite personalização da experiência dentro do aplicativo.

**Funcionalidades**

- Cadastro e login de usuários
- Edição de informações pessoais (nome, e-mail, foto, preferências)
- Configurações de notificações e idioma
- Integração com o sistema de automações da cozinha (futuro)
- Sincronização de dados com o dispositivo móvel
- Logout e limpeza de sessão local

**Interface Mobile**

- Tela inicial com informações do usuário (foto, nome, preferências)
- Tela de edição de perfil com campos interativos
- Tela de configurações (idioma, notificações, privacidade)
- Integração com AsyncStorage para persistência local de sessão
- Uso de ícones e componentes visuais do React Native Vector Icons

**Regras de Negócio**

- E-mail deve ser único e validado antes do cadastro
- Senha deve conter pelo menos 8 caracteres
- O perfil só pode ser editado pelo próprio usuário autenticado
- Dados locais devem ser atualizados sempre que houver mudança no servidor
- Sessões expiram automaticamente após determinado período de inatividade

**📦 Kitchen Brain – Módulo de Estoque**

O módulo de estoque do Kitchen Brain é responsável por gerenciar os ingredientes, produtos e insumos da cozinha. Ele controla entrada, saída, atualização de quantidades, alertas de validade e integração com receitas.

**Funcionalidades**

- Listagem de itens do estoque
- Cadastro de novo item (nome, quantidade, unidade, validade)
- Atualização de quantidade (entrada/saída)
- Exclusão de itens
- Alertas de validade e de estoque baixo
- Integração com o Módulo de Receitas para checagem de disponibilidade

**Interface Mobile**

- Tela principal com listagem de itens e status por cor (verde: ok, amarelo: alerta, vermelho: vencido/baixo)
- Botão flutuante para adicionar novo item
- Tela de detalhes com histórico de movimentação e edição

**Regras de Negócio**

- Quantidade não pode ser negativa
- Nome de produto deve ser único dentro do estoque do usuário
- Itens vencidos não podem ser marcados como "disponíveis"
- Alerta deve ser emitido 3 dias antes da data de validade

**📦 Kitchen Brain – Módulo de Receitas**

O módulo de receitas é o núcleo do Kitchen Brain, responsável por gerenciar o vasto catálogo de pratos, o passo a passo de preparo, e as interações com o estoque do usuário. Este módulo calcula a disponibilidade de ingredientes e sugere o que cozinhar.

**Funcionalidades**

- Listagem e busca de receitas por nome, ingrediente ou tempo de preparo
- Criação e edição de novas receitas (privadas ou públicas)
- Cálculo da viabilidade de preparo com base nos ingredientes do Estoque
- Sugestão de lista de compras para ingredientes faltantes
- Armazenamento de notas e avaliações do usuário para cada receita
- Marcação de receitas como favoritas

**Interface Mobile**

- Tela principal de exploração (feed) com filtros de busca
- Tela de detalhes da receita (ingredientes, passos, tempo, notas)
- Formulário intuitivo para a criação de novas receitas
- Visualização de um "carrinho" de compras com itens faltantes

**Regras de Negócio**

- Toda receita deve ter um tempo de preparo estimado e uma lista de ingredientes
- Receitas criadas pelo usuário são privadas por padrão, mas podem ser tornadas públicas
- A viabilidade da receita (cálculo de ingredientes) deve consultar o Módulo de Estoque em tempo real
- Apenas o criador da receita ou um administrador pode editá-la ou excluí-la

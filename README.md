# kitchen_brain

uvicorn app.main:app --reload

////////////////////////////////////////////////////////////
Documentação ConfigsScreen.jsx
Importações
•  View: Contêiner para estruturar a tela.
•  Text: Componente para exibir textos.
•  TouchableOpacity: Botão clicável com efeito de opacidade.
•  StyleSheet: Criação de estilos para os componentes.
•  FlatList: Componente para renderizar listas de forma eficiente.
•  @expo/vector-icons: Biblioteca de ícones, usada aqui para personalizar os itens da lista. 

Componente ConfigScreen
• navigation: objeto do React Navigation, que permite navegar entre telas (não está sendo usado para navegação ainda, apenas no console.log).
• settings: Array de objetos, cada um representando uma opção de configuração:
• id: Identificador único (usado como keyExtractor do FlatList).
• title: Nome do item.
• icon: Ícone exibido antes do título.

Função renderItem
•  renderItem: Função que define como cada item da lista será renderizado.
• Exibe o ícone (item.icon) à esquerda.
• Exibe o título (item.title) ao centro.
• Exibe uma seta (chevron-forward) à direita.
• Ao clicar, imprime no console qual item foi clicado.

Estrutura do Componente
•  View container: Abriga toda a tela.
•  Text header: Título da tela.
•  FlatList: Renderiza a lista de configurações:
data: dados da lista (settings).
keyExtractor: retorna o id de cada item.
renderItem: função para renderizar cada item.
ItemSeparatorComponent: linha de separação entre os itens.

Estilos (StyleSheet)
•  container: Define layout principal, cor de fundo e padding.
•  header: Título grande e negrito com margem inferior.
•  item: Linha da lista, horizontal, com padding vertical.
•  icon: Espaço reservado para o ícone do item.
•  title: Texto do item, ocupa espaço restante (flex: 1).
•  separator: Linha fina entre os itens.
////////////////////////////////////////////////////////////

Visão Geral

O ConfigsScreen é um componente de tela que exibe uma lista de opções de configuração (como "Perfil", "Notificações", "Sobre", etc.). Cada item da lista é clicável e exibe um ícone, um título e uma seta indicativa. A lista é renderizada de forma eficiente utilizando o componente FlatList.

Funcionalidades Principais

    Exibe um título claro no topo da tela.

    Renderiza uma lista vertical de opções de configuração.

    Cada item da lista possui um ícone, um título e uma seta para a direita.

    Utiliza TouchableOpacity para fornecer feedback visual ao pressionar um item.

    Exibe um separador visual entre cada item da lista.

    Registra no console qual item foi pressionado (funcionalidade de navegação a ser implementada).

Dependências

Para funcionar corretamente, o componente importa os seguintes pacotes e componentes:


    React Native:

        View: Contêiner principal para layout.

        Text: Para exibição de textos.

        TouchableOpacity: Componente de botão com feedback de opacidade.

        StyleSheet: Para criar e organizar os estilos.

        FlatList: Para renderizar listas longas com performance.

    @expo/vector-icons:

        Ionicons: Biblioteca de ícones utilizada para o ícone de cada item e a seta.

Estrutura do Componente

O componente é organizado da seguinte forma:

    View (container): O contêiner raiz que envolve toda a tela.

    Text (header): O título principal da tela, "Configurações".

    FlatList: O elemento central que renderiza a lista. Ele é configurado com:

        data: O array settings que contém os dados da lista.

        renderItem: A função que define a aparência de cada item.

        keyExtractor: Uma função que extrai o id de cada item como chave única.

        ItemSeparatorComponent: Renderiza um componente View para criar a linha separadora.

Função renderItem

A função renderItem é responsável por renderizar cada linha da FlatList. A estrutura de cada item é:

    TouchableOpacity (item): Invólucro que torna a linha inteira clicável.

        Ionicons (icon): Exibe o ícone (item.icon) à esquerda.

        Text (title): Exibe o título (item.title) no centro, ocupando o espaço restante.

        Ionicons (chevron): Exibe uma seta (chevron-forward) fixa à direita.

Props

Estrutura de Dados

O componente utiliza um array de objetos estático chamado settings para alimentar a FlatList. Cada objeto no array deve seguir a seguinte estrutura:

Exemplo:

Estilização (StyleSheet)

Os estilos do componente estão centralizados em um objeto StyleSheet para melhor organização e performance.

    container: Estilo do contêiner principal. Define o flex, backgroundColor e padding.

    header: Estilo do título da tela. Define fontSize, fontWeight e marginBottom.

    item: Estilo para cada linha da lista. Usa flexDirection: 'row' e alignItems: 'center' para alinhar ícone e texto.

    icon: Estilo para o ícone, definindo a marginRight.

    title: Estilo para o texto do item. Usa flex: 1 para que o texto ocupe todo o espaço disponível entre o ícone e a seta.

    separator: Estilo da linha fina que separa os itens da lista.








# kitchen_brain

uvicorn app.main:app --reload

Documentação ConfigsScreen.jsx

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

<img width="707" height="43" alt="image3primeira" src="https://github.com/user-attachments/assets/0fc45a12-633e-4019-97ff-39d44a83004f" />



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

<img width="703" height="271" alt="image5" src="https://github.com/user-attachments/assets/446263b9-e350-4fbe-bf80-93defbc15b02" />


    View (container): O contêiner raiz que envolve toda a tela.

    Text (header): O título principal da tela, "Configurações".

    FlatList: O elemento central que renderiza a lista. Ele é configurado com:

        data: O array settings que contém os dados da lista.

        renderItem: A função que define a aparência de cada item.

        keyExtractor: Uma função que extrai o id de cada item como chave única.

        ItemSeparatorComponent: Renderiza um componente View para criar a linha separadora.

Função renderItem

A função renderItem é responsável por renderizar cada linha da FlatList. A estrutura de cada item é:

<img width="705" height="136" alt="image4" src="https://github.com/user-attachments/assets/e8b6a718-9ae7-48cf-ad70-62b134b61945" />


    TouchableOpacity (item): Invólucro que torna a linha inteira clicável.

        Ionicons (icon): Exibe o ícone (item.icon) à esquerda.

        Text (title): Exibe o título (item.title) no centro, ocupando o espaço restante.

        Ionicons (chevron): Exibe uma seta (chevron-forward) fixa à direita.

Props

Estrutura de Dados

O componente utiliza um array de objetos estático chamado settings para alimentar a FlatList. Cada objeto no array deve seguir a seguinte estrutura:

<img width="705" height="128" alt="imagem2" src="https://github.com/user-attachments/assets/a8924884-e5a8-4dad-aa87-3c7af0285492" />



Estilização (StyleSheet)

Os estilos do componente estão centralizados em um objeto StyleSheet para melhor organização e performance.

<img width="164" height="366" alt="image" src="https://github.com/user-attachments/assets/8c4a6617-3ae3-47ac-b6e4-d9bb8f495888" />


    container: Estilo do contêiner principal. Define o flex, backgroundColor e padding.

    header: Estilo do título da tela. Define fontSize, fontWeight e marginBottom.

    item: Estilo para cada linha da lista. Usa flexDirection: 'row' e alignItems: 'center' para alinhar ícone e texto.

    icon: Estilo para o ícone, definindo a marginRight.

    title: Estilo para o texto do item. Usa flex: 1 para que o texto ocupe todo o espaço disponível entre o ícone e a seta.

    separator: Estilo da linha fina que separa os itens da lista.

////////////////////////////////////////////////////////////////////////

Documentação VoiceRecScreen.jsx

O código implementa uma tela de gravação de voz no React Native (com Expo).
Ele grava áudio via expo-av, exibe uma animação pulsante que simula o volume da fala, e gera palavras aleatórias para simular uma transcrição.









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

Início do componente

![função export](./mobile/imagens/imgexport.png)

Cria a tela principal. Recebe ```navigation``` se quiser trocar de telas.

Estados

![função export](./mobile/imagens/States.png)
```
recording: guarda o objeto da gravação.

isRecording: indica se está gravando ou não.

recognizedText: texto que aparece na caixa (simulação da fala).

amplitude: controla o tamanho do círculo animado (1 = normal).
```
Função da animação

![função export](./mobile/imagens/WaveAnim.png)

Faz o círculo “pulsar”.
A cada chamada, o valor muda de 1 pra algo tipo 1.3, e volta.
useNativeDriver: true faz a animação mais leve (roda no thread nativo).

Função para iniciar a gravação

![função export](./mobile/imagens/StartRecFunc.png)

Pede permissão pro microfone.
Se o usuário negar, mostra um alerta e sai da função.

![função export](./mobile/imagens/AudioContainer.png)

Cria e inicia uma gravação com alta qualidade.
O objeto recording é retornado e contém o controle da gravação.

Função para parar a gravação

![função export](./mobile/imagens/StopRecFunc.png)

Quando o usuário clica em “Parar”:

Para a gravação.
Obtém o endereço (uri) do arquivo de áudio.
Reseta os estados e animação.

Interface Visual

Título

![função export](./mobile/imagens/Title.png)

Texto no topo da tela. (Poderia ser “Gravação de Voz”.)

Caixa de texto

![função export](./mobile/imagens/TextBox.png)

Mostra o texto “reconhecido”.
O usuário também pode editar manualmente.

Logo + círculo animado

![função export](./mobile/imagens/Logo+Circle.png)

Aqui rola a animação principal:

O círculo verde (pulseCircle) cresce e diminui conforme o som.
A logo fica sobreposta no centro (estática).

Botão de gravação

![função export](./mobile/imagens/RecButton.png)

O botão muda de cor e ícone:

Verde com microfone quando não grava.
Vermelho com microfone cortado quando está gravando.
O clique alterna entre startRecording e stopRecording.


Documentação CardápioBotScreen

1. Importações


```
React, useState, useEffect, useRef: Hooks essenciais do React para estado, efeitos colaterais e referências.

ActivityIndicator: Spinner para mostrar carregamento.

FlatList: Lista eficiente para mensagens do chat.

KeyboardAvoidingView: Ajusta a UI quando o teclado aparece (iOS/Android).

Platform: Detecta a plataforma para comportamentos diferentes.

TextInput, TouchableOpacity, View, Text: Componentes básicos de interface.

Keyboard: Permite escutar eventos do teclado.

useHeaderHeight: Retorna a altura real do header do navigation stack (importante para offset do teclado).

Constants: Permite pegar configurações do Expo (como API_KEY).

Ionicons: Ícones da biblioteca de ícones do Expo/React Native
```
2. Constantes de configuração
```
const GEMINI_MODEL = "gemini-2.5-flash"; // modelo Gemini usado para gerar conteúdo
const API_KEY = Constants.expoConfig?.extra?.GEMINI_API_KEY; // chave da API do Gemini
```
- Define o modelo generativo e a chave de API.
```
const EMOJIS = ["😀","😁","😂","😊","😍","😋","😎","🤔","🙌","👍","👎","🥗","🍲","🍛","🍳","🥪","🍎","🥦","🧀","🥖","🍗"];
```
- Array de emojis disponíveis para o teclado emoji do chat.
```
const STARTER_BOT_MSG = {
  id: "m0",
  role: "bot",
  text: "Bom dia! Sou seu assistente de geração de cardápios! Inicie uma conversa comigo para que eu possa te auxiliar a montar o melhor cardápio possível para você!",
};
```
- Mensagem inicial do bot ao abrir a tela.

3. Estado do componente
```
const [messages, setMessages] = useState([STARTER_BOT_MSG]); // array de mensagens
const [text, setText] = useState(""); // texto do input
const [loading, setLoading] = useState(false); // indica se uma requisição está em andamento
const [showEmoji, setShowEmoji] = useState(false); // mostra ou esconde o painel de emojis
```
- messages: histórico do chat.

- text: texto digitado no input.

- loading: controla spinner e bloqueio do input enquanto o bot responde.

- showEmoji: boolean que controla a exibição do teclado emoji.

4. Refs e altura do header
```
const listRef = useRef(null); // referência para FlatList (scroll)
const inputRef = useRef(null); // referência para TextInput (focus)
const headerHeight = useHeaderHeight(); // altura real do header para offset do teclado
```
- listRef: usado para scroll automático ao enviar/receber mensagens.

- inputRef: permite focar o input programaticamente.

- headerHeight: usado no KeyboardAvoidingView para calcular offset.



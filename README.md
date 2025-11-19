**# kitchen_brain

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


 CardápioBotScreen — Visão Geral

A CardapioBotScreen é a tela onde o usuário conversa com o assistente culinário para gerar cardápios personalizados, ajustar refeições e exportar tudo em PDF.
Para facilitar o entendimento, aqui estão as funcionalidades da tela e depois como o código implementa essas funcionalidades.



  Funcionalidades da Tela

### 1. Chat com o assistente

O usuário conversa com o bot como se fosse um chat normal.
Ele envia pedidos como “quero um cardápio para 3 dias” e recebe cardápios estruturados, mensagens explicativas, PDFs e sugestões.

### 2. Geração de cardápios personalizados

O cardápio é montado com base em várias informações:

* preferências alimentares
* restrições (alergias, estilo alimentar)
* itens da despensa (em especial os que estão para vencer)
* tempo máximo de preparo
* orçamento
* número de porções
* equipamentos disponíveis
* culinárias desejadas

O usuário ajusta tudo isso através dos chips e seletores no topo da tela ou por mensagens diretas.

### 3. Ajustes rápidos no cardápio já gerado

O usuário pode pedir:

* “troque o almoço de terça”
* “remove o café da manhã”
* “troque frango por tofu”

A tela identifica esses comandos e modifica apenas o que foi pedido, sem gerar tudo de novo.

### 4. Geração e download de PDF

Depois que o cardápio é gerado, o app transforma o conteúdo em PDF.
O usuário pode baixar ou compartilhar o arquivo.

### 5. Emojis, digitação e experiência de chat

A tela inclui:

* painel de emojis
* indicador de “bot digitando...”
* rolagem automática
* mensagem inicial de boas-vindas



  Como o Código Implementa Isso

### 1. Estados principais

O código mantém:

* o histórico do chat (messages)
* o texto digitado pelo usuário
* o indicador de carregamento
* o painel de emojis
* os parâmetros do planejamento (dias, orçamento, etc.)
* o último cardápio gerado (para PDFs e ajustes)

Esses estados alimentam o `requestContext`, um objeto JSON gigante enviado ao modelo sempre que o usuário interage.

### 2. requestContext

É um objeto montado com `useMemo` que junta:

* perfil alimentar
* metas nutricionais
* itens para vencer
* preferências culinárias
* configurações dos chips
* histórico do último cardápio
* e o que mais for necessário para o planejamento

Esse JSON é enviado para o modelo no prompt final.

### 3. Comunicação com o modelo

A função `callGemini` faz a requisição à API.
Se a API falhar, o código usa um cardápio mockado (payload de fallback).

### 4. Fluxo do envio de mensagens

A função `handleSend` faz tudo:

1. adiciona a mensagem do usuário
2. mostra “bot digitando”
3. monta o prompt
4. chama a API
5. analisa a resposta
6. extrai o JSON do cardápio
7. gera o PDF
8. insere o cardápio no chat

### 5. Processamento da resposta

Depois que chega a resposta do modelo:

* `parseMenuChip` extrai o JSON delimitado pelas tags
* `applyUserOverrides` examina pedidos de troca/remoção
* `generateMenuPdf` transforma o JSON em HTML e depois em PDF
* `buildMenuHtml` monta o HTML final

### 6. Renderização

A tela usa uma `FlatList` para o chat, que escolhe automaticamente se a mensagem é:

* texto do usuário
* texto do bot
* cardápio
* PDF
* indicador de digitação

Também existem componentes específicos para:

* pré-visualização do cardápio
* anexos PDF
* barra de input



 ConfirmItemsScreen — Visão Geral

A `ConfirmItemsScreen` é a tela onde o usuário revisa itens detectados automaticamente antes de colocá-los no estoque.



 Funcionalidades da Tela

### 1. Revisar itens detectados por voz/OCR

Cada item aparece com:

* nome sugerido
* candidatos parecidos (produtos existentes)
* quantidade
* unidade
* validade
* local de armazenamento

### 2. Ajustar os itens manualmente

O usuário pode:

* editar nome
* escolher um produto existente
* definir o local (geladeira, freezer, armário)
* ajustar quantidade e validade
* abrir ou fechar cada item para ver mais detalhes

### 3. Confirmar tudo e enviar para o estoque

Depois de revisar, o usuário confirma e o app:

* decide se o item cria um produto novo
* ou se liga a um produto existente
* envia tudo para a API
* redireciona para a tela de estoque



Como o Código Implementa Isso

### 1. Controle dos itens

A tela recebe `initialItems` via navegação.
Cada item vira um objeto editável em `rows`, incluindo:

* campos para edição
* candidatos
* se está expandido ou não

### 2. Edição dos campos

`setField` atualiza qualquer campo do item.
`onChangeCandidate` define o produto selecionado e limpa o nome customizado.

### 3. Confirmação

`onConfirm` percorre os itens, monta a estrutura final, chama a API `confirmVoiceItems` e troca a tela para “Stock”.

### 4. UI

A FlatList renderiza:

* cartão recolhido (nome + texto original)
* cartão expandido (tudo editável)
* sugestões, chips de locais e inputs

O botão final usa loading para indicar salvamento.







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



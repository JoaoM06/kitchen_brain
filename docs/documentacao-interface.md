# 📦 Kitchen Brain -- Documentação da Interface (Contrato entre Módulo de Estoque e Módulo de Transcrição)

Esta documentação descreve o contrato oficial de comunicação entre o
**Módulo de Estoque** e o **Módulo de Transcrição** do Kitchen Brain.
Ela segue o mesmo estilo e padrão adotado nas documentações anteriores
dos módulos de Perfil, Estoque e Receitas, garantindo consistência e
clareza.

------------------------------------------------------------------------

## 🧩 **Visão Geral do Módulo de Transcrição**

O Módulo de Transcrição é responsável por: - Interpretar comandos de voz
gravados pelo usuário; - Converter áudio em texto estruturado; -
Identificar intenções relacionadas ao controle do estoque; - Enviar
comandos validados ao Módulo de Estoque.

Sua função é servir como uma ponte entre interações por voz e operações
de CRUD no estoque.

------------------------------------------------------------------------

## 🔌 **Comunicação entre Estoque e Transcrição**

A comunicação entre ambos os módulos ocorre via API REST, utilizando
**Pydantic Models** para validação dos dados na entrada e saída.

As principais operações de integração são: - Registrar itens no estoque
via comando transcrito; - Atualizar quantidades (entrada/saída); -
Consultar disponibilidade; - Receber ações interpretadas pelo modelo de
NLP.

------------------------------------------------------------------------

## 📄 **Contrato de Dados (Pydantic Models)**

### **1. ItemBase (Base do Estoque)**

``` python
class ItemBase(BaseModel):
    nome: str
    quantidade: float
    unidade: str
    validade: Optional[date] = None
```

### **2. ItemCreate (Criado via Transcrição)**

``` python
class ItemCreate(ItemBase):
    origem_transcricao: bool = True
    comando_raw: str
```

### **3. ItemUpdateQuantidade**

``` python
class ItemUpdateQuantidade(BaseModel):
    operacao: Literal["entrada", "saida"]
    quantidade: float
    origem_transcricao: bool = True
    comando_raw: str
```

### **4. IntentDetectada (Modelo vindo da Transcrição)**

``` python
class IntentDetectada(BaseModel):
    tipo: Literal[
        "adicionar_item",
        "atualizar_quantidade",
        "consultar_item",
        "remover_item"
    ]
    entidade_item: Optional[str]
    quantidade: Optional[float]
    unidade: Optional[str]
    validade: Optional[date]
    comando_raw: str
```

### **5. RespostaProcessamentoTranscricao**

``` python
class RespostaProcessamentoTranscricao(BaseModel):
    sucesso: bool
    mensagem: str
    item_afetado: Optional[str]
    operacao_realizada: Optional[str]
```

------------------------------------------------------------------------

## 🚀 **Fluxo de Comunicação**

### **1. Usuário grava áudio**

O módulo de transcrição recebe o áudio e o converte para texto.

### **2. NLP interpreta intenção**

A intenção é enviada ao backend no formato do modelo `IntentDetectada`.

### **3. Estoque processa o comando**

Dependendo da intenção: - cria um item (`ItemCreate`) - atualiza
quantidade (`ItemUpdateQuantidade`) - consulta item - remove item

### **4. Resposta é retornada ao módulo de Transcrição**

O módulo envia feedback claro ao usuário.

------------------------------------------------------------------------

## 📱 **Interface Mobile (Integração com Transcrição)**

-   Botão de gravação de comando de voz
-   Indicador de detecção automática de intenção
-   Exibição do texto interpretado antes de confirmar a ação
-   Tela de confirmação da operação de estoque detectada

------------------------------------------------------------------------

## ⚙️ **Regras de Negócio da Integração**

-   Todo comando transcrito deve armazenar o `comando_raw` para
    auditoria.
-   Caso o nome do item não seja totalmente reconhecido, o aplicativo
    deve solicitar confirmação.
-   Atualizações de quantidade feitas via voz **não podem** exceder
    limites definidos pelo usuário.
-   Comandos ambíguos devem retornar erro explicando o problema.
-   A criação de itens via voz deve validar o nome, unidade e
    quantidade.

------------------------------------------------------------------------

## 🗂️ **Exemplos de Fluxos (JSON)**

### **1. Criar item via comando de voz**

``` json
{
  "tipo": "adicionar_item",
  "entidade_item": "arroz",
  "quantidade": 2,
  "unidade": "kg",
  "validade": "2025-03-01",
  "comando_raw": "Adicionar dois quilos de arroz no estoque"
}
```

### **2. Atualizar quantidade (saída)**

``` json
{
  "tipo": "atualizar_quantidade",
  "entidade_item": "leite",
  "quantidade": 1,
  "unidade": "L",
  "comando_raw": "Use um litro de leite"
}
```

------------------------------------------------------------------------

## 🧪 **Testes Esperados (Contratos)**

-   Verificação de que nomes ambíguos retornam erro de validação.
-   Testes de borda: quantidade negativa, validade no passado.
-   Simulação de áudio contendo múltiplas ações --- o sistema deve
    isolar apenas a instrução mais clara.
-   Mensagens sempre devem retornar campos completos em
    `RespostaProcessamentoTranscricao`.

------------------------------------------------------------------------

## 📚 **Conclusão**

Este documento define o contrato oficial entre o Módulo de Estoque e o
Módulo de Transcrição, garantindo consistência, padronização e clareza
entre as operações. Ele deve ser seguido tanto pelo backend quanto por
qualquer integração futura de voz ou IA.

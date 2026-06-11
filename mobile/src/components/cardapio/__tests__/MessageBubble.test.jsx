import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import { MessageBubble, TypingRow } from "../MessageBubble";

describe("MessageBubble", () => {
  it("mostra o texto da mensagem do bot com o nome CardapioBot", () => {
    const { getByText } = render(
      <MessageBubble item={{ id: "1", role: "bot", text: "Olá!" }} onGeneratePdf={() => {}} />
    );
    expect(getByText("Olá!")).toBeTruthy();
    expect(getByText("CardapioBot")).toBeTruthy();
  });

  it("não mostra o nome do bot em mensagem do usuário", () => {
    const { queryByText, getByText } = render(
      <MessageBubble item={{ id: "2", role: "user", text: "Quero um cardápio" }} />
    );
    expect(getByText("Quero um cardápio")).toBeTruthy();
    expect(queryByText("CardapioBot")).toBeNull();
  });

  it("dispara onGeneratePdf ao tocar no botão de PDF", () => {
    const onGeneratePdf = jest.fn();
    const item = { id: "3", role: "bot", text: "Pronto", showPdfButton: true, menuChipForPdf: { id: "m1" } };
    const { getByText } = render(<MessageBubble item={item} onGeneratePdf={onGeneratePdf} />);
    fireEvent.press(getByText("Baixar cardápio em PDF"));
    expect(onGeneratePdf).toHaveBeenCalledWith({ id: "m1" }, "3");
  });
});

describe("TypingRow", () => {
  it("renderiza sem erros", () => {
    const { toJSON } = render(<TypingRow />);
    expect(toJSON()).toBeTruthy();
  });
});

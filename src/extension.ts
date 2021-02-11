// Vaguely based on https://github.com/mishkinf/vscode-goto-next-previous-member/blob/master/src/extension.ts
"use strict";
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const getContainingSymbols = async (editor: vscode.TextEditor) => {
    const rootSymbols = await vscode.commands.executeCommand<
      vscode.DocumentSymbol[]
    >("vscode.executeDocumentSymbolProvider", editor.document.uri);

    if (!rootSymbols) {
      return [];
    }

    const containingSymbols: vscode.DocumentSymbol[] = [];

    const addContainingSymbols = (symbols: vscode.DocumentSymbol[]) => {
      symbols
        .filter((symbol: vscode.DocumentSymbol) =>
          symbol.range.contains(editor.selection.active)
        )
        .forEach((symbol: vscode.DocumentSymbol) => {
          containingSymbols.push(symbol);
          if (symbol.children && symbol.children.length > 0) {
            addContainingSymbols(symbol.children);
          }
        });
    };

    addContainingSymbols(rootSymbols);

    return containingSymbols;
  };

  const selectContainingMember = async (
    editor: vscode.TextEditor,
    symbolMatcher: (symbol: vscode.DocumentSymbol) => boolean,
    rangeGetter: (symbol: vscode.DocumentSymbol) => vscode.Range
  ) => {
    const containingSymbols = await getContainingSymbols(editor);
    const matchingSymbols = containingSymbols.filter(symbolMatcher);

    if (matchingSymbols.length === 0) {
      return;
    }

    var range = rangeGetter(matchingSymbols[matchingSymbols.length - 1]);

    if (range.isEqual(editor.selection) && matchingSymbols.length >= 2) {
      range = rangeGetter(matchingSymbols[matchingSymbols.length - 2]);
    }

    editor.selection = new vscode.Selection(range.start, range.end);
    vscode.commands.executeCommand("revealLine", {
      lineNumber: range.start.line,
    });
  };

  const selectSymbolToken = (symbol: vscode.DocumentSymbol) =>
    symbol.range.isEqual(symbol.selectionRange)
      ? new vscode.Range(symbol.range.start, symbol.range.start)
      : symbol.selectionRange;

  const selectSymbolDefinition = (symbol: vscode.DocumentSymbol) =>
    symbol.range;

  const anyMember = (symbol: vscode.DocumentSymbol) => true;

  const isFunction = (symbol: vscode.DocumentSymbol) =>
    symbol.kind === vscode.SymbolKind.Function;

  const isClass = (symbol: vscode.DocumentSymbol) =>
    symbol.kind === vscode.SymbolKind.Class;

  const jumpToContainingMemberCommand = vscode.commands.registerTextEditorCommand(
    "semantic-movement.jumpToContainingMember",
    async (editor: vscode.TextEditor) => {
      await selectContainingMember(editor, anyMember, selectSymbolToken);
    }
  );

  const selectContainingMemberCommand = vscode.commands.registerTextEditorCommand(
    "semantic-movement.selectContainingMember",
    async (editor: vscode.TextEditor) => {
      await selectContainingMember(editor, anyMember, selectSymbolDefinition);
    }
  );

  const jumpToContainingClassCommand = vscode.commands.registerTextEditorCommand(
    "semantic-movement.jumpToContainingClass",
    async (editor: vscode.TextEditor) => {
      await selectContainingMember(editor, isClass, selectSymbolToken);
    }
  );

  const selectContainingClassCommand = vscode.commands.registerTextEditorCommand(
    "semantic-movement.selectContainingClass",
    async (editor: vscode.TextEditor) => {
      await selectContainingMember(editor, isClass, selectSymbolDefinition);
    }
  );

  const jumpToContainingFunctionCommand = vscode.commands.registerTextEditorCommand(
    "semantic-movement.jumpToContainingFunction",
    async (editor: vscode.TextEditor) => {
      await selectContainingMember(editor, isFunction, selectSymbolToken);
    }
  );

  const selectContainingFunctionCommand = vscode.commands.registerTextEditorCommand(
    "semantic-movement.selectContainingFunction",
    async (editor: vscode.TextEditor) => {
      await selectContainingMember(editor, isFunction, selectSymbolDefinition);
    }
  );

  context.subscriptions.push(
    jumpToContainingClassCommand,
    jumpToContainingFunctionCommand,
    jumpToContainingMemberCommand,
    selectContainingClassCommand,
    selectContainingFunctionCommand,
    selectContainingMemberCommand
  );
}

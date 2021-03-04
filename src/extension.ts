"use strict";
import * as vscode from "vscode";

class NoContainingSymbolError extends Error {}

export function activate(context: vscode.ExtensionContext) {
  const getContainingSymbols = (
    selection: vscode.Selection,
    rootSymbols: vscode.DocumentSymbol[]
  ) => {
    const containingSymbols: vscode.DocumentSymbol[] = [];

    const addContainingSymbols = (symbols: vscode.DocumentSymbol[]) => {
      symbols
        .filter((symbol: vscode.DocumentSymbol) =>
          symbol.range.contains(selection)
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

  const selectContainingSymbolOneCursor = (
    selection: vscode.Selection,
    rootSymbols: vscode.DocumentSymbol[],
    symbolMatcher: (symbol: vscode.DocumentSymbol) => boolean,
    rangeGetter: (symbol: vscode.DocumentSymbol) => vscode.Range
  ) => {
    const containingSymbols = getContainingSymbols(selection, rootSymbols);

    if (containingSymbols.length === 0) {
      throw new NoContainingSymbolError();
    }

    let matchingSymbols = containingSymbols.filter(symbolMatcher);

    if (matchingSymbols.length === 0) {
      // NB: This is a hack. If a function is also a property it appears as a
      // property, so if there was no function found we assumed that this is
      // what happened.
      matchingSymbols = containingSymbols;
    }

    var range = rangeGetter(matchingSymbols[matchingSymbols.length - 1]);

    if (range.isEqual(selection) && matchingSymbols.length >= 2) {
      range = rangeGetter(matchingSymbols[matchingSymbols.length - 2]);
    }

    return new vscode.Selection(range.start, range.end);
  };

  const selectContainingSymbol = async (
    editor: vscode.TextEditor,
    symbolMatcher: (symbol: vscode.DocumentSymbol) => boolean,
    rangeGetter: (symbol: vscode.DocumentSymbol) => vscode.Range
  ) => {
    const rootSymbols = await vscode.commands.executeCommand<
      vscode.DocumentSymbol[]
    >("vscode.executeDocumentSymbolProvider", editor.document.uri);

    if (!rootSymbols) {
      return;
    }

    try {
      const newSelections = editor.selections.map((selection, selectionIndex) =>
        selectContainingSymbolOneCursor(
          selection,
          rootSymbols,
          symbolMatcher,
          rangeGetter
        )
      );

      editor.selections = newSelections;

      vscode.commands.executeCommand("revealLine", {
        lineNumber: newSelections[0].start.line,
      });
    } catch (e) {
      if (e instanceof NoContainingSymbolError) {
        return;
      } else {
        throw e; // re-throw the error unchanged
      }
    }
  };

  const selectSymbolToken = (symbol: vscode.DocumentSymbol) =>
    symbol.range.isEqual(symbol.selectionRange)
      ? new vscode.Range(symbol.range.start, symbol.range.start)
      : symbol.selectionRange;

  const selectSymbolDefinition = (symbol: vscode.DocumentSymbol) =>
    symbol.range;

  const anySymbol = (symbol: vscode.DocumentSymbol) => true;

  const isFunction = (symbol: vscode.DocumentSymbol) =>
    symbol.kind === vscode.SymbolKind.Function ||
    symbol.kind === vscode.SymbolKind.Method;

  const isNamedFunction = (symbol: vscode.DocumentSymbol) =>
    isFunction(symbol) && !symbol.range.isEqual(symbol.selectionRange);

  const isClass = (symbol: vscode.DocumentSymbol) =>
    symbol.kind === vscode.SymbolKind.Class;

  const jumpToContainingSymbolCommand = vscode.commands.registerTextEditorCommand(
    "semantic-movement.jumpToContainingSymbol",
    async (editor: vscode.TextEditor) => {
      await selectContainingSymbol(editor, anySymbol, selectSymbolToken);
    }
  );

  const selectContainingSymbolCommand = vscode.commands.registerTextEditorCommand(
    "semantic-movement.selectContainingSymbol",
    async (editor: vscode.TextEditor) => {
      await selectContainingSymbol(editor, anySymbol, selectSymbolDefinition);
    }
  );

  const jumpToContainingClassCommand = vscode.commands.registerTextEditorCommand(
    "semantic-movement.jumpToContainingClass",
    async (editor: vscode.TextEditor) => {
      await selectContainingSymbol(editor, isClass, selectSymbolToken);
    }
  );

  const selectContainingClassCommand = vscode.commands.registerTextEditorCommand(
    "semantic-movement.selectContainingClass",
    async (editor: vscode.TextEditor) => {
      await selectContainingSymbol(editor, isClass, selectSymbolDefinition);
    }
  );

  const jumpToContainingFunctionCommand = vscode.commands.registerTextEditorCommand(
    "semantic-movement.jumpToContainingFunction",
    async (editor: vscode.TextEditor) => {
      await selectContainingSymbol(editor, isFunction, selectSymbolToken);
    }
  );

  const selectContainingFunctionCommand = vscode.commands.registerTextEditorCommand(
    "semantic-movement.selectContainingFunction",
    async (editor: vscode.TextEditor) => {
      await selectContainingSymbol(editor, isFunction, selectSymbolDefinition);
    }
  );

  const jumpToContainingNamedFunctionCommand = vscode.commands.registerTextEditorCommand(
    "semantic-movement.jumpToContainingNamedFunction",
    async (editor: vscode.TextEditor) => {
      await selectContainingSymbol(editor, isNamedFunction, selectSymbolToken);
    }
  );

  const selectContainingNamedFunctionCommand = vscode.commands.registerTextEditorCommand(
    "semantic-movement.selectContainingNamedFunction",
    async (editor: vscode.TextEditor) => {
      await selectContainingSymbol(
        editor,
        isNamedFunction,
        selectSymbolDefinition
      );
    }
  );

  context.subscriptions.push(
    jumpToContainingClassCommand,
    jumpToContainingFunctionCommand,
    jumpToContainingNamedFunctionCommand,
    jumpToContainingSymbolCommand,
    selectContainingClassCommand,
    selectContainingNamedFunctionCommand,
    selectContainingSymbolCommand
  );
}

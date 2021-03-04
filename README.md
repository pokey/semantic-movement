# semantic-movement

Navigate a file using the same symbols that define breadcrumbs.  Allows you to
move to the function, class or symbol that contains your cursor, as well as
select the entire symbol definition that contains your cursor.  Supports
multiple cursors.

## Features

Provides a set of commands for moving and selecting the function, class or
symbol containing the cursor.  For each command, if you repeat it, it will
continue moving up the hierarchy and select the larger function / class /
symbol that contains the cursor.

![Basic demo](images/semantic-movement-1.gif)

### Commands

| Command                                      | Description               |
| -------------------------------------------- |:------------------------- |
| `semantic-movement.jumpToContainingSymbol` | Jump to Containing Symbol |
| `semantic-movement.selectContainingSymbol` | Select Containing Symbol |
| `semantic-movement.jumpToContainingFunction` | Jump to Containing Function |
| `semantic-movement.selectContainingFunction` | Select Containing Function |
| `semantic-movement.jumpToContainingNamedFunction` | Jump to Containing Named Function |
| `semantic-movement.selectContainingNamedFunction` | Select Containing Named Function |
| `semantic-movement.jumpToContainingClass` | Jump to Containing Class |
| `semantic-movement.selectContainingClass` | Select Containing Class |

## Known Issues


## Release Notes
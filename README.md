# Do

Brings simple but powerful custom keycommands, macros and autostart services to VS Code.
Rewritten by [Jan Manue Schlieper](http://audio.d3ck.net/about)
Inspired by the <3 of [geddski](http://gedd.ski)

## example


```json

```

## Create Custom Macros

Create your own custom macros by adding them to your `settings.json` (Code|File > Preferences > User Settings)

settings:

```json
"do.defaultType":"terminal", // the default
"do.macros": {
    "openFile":
    "commentDown": [
        "editor.action.copyLinesDownAction", //
        "cursorUp",
        "editor.action.addCommentLine",
        "cursorDown"
    ]
}
```

This macro creates a copy of the current line, comments out the original line, and moves the cursor down to the copy.

Your macros can run any built-in VS Code action, and even actions from other extensions. 
To see all the names of possible actions VS Code can run, see `Default Keyboard Shortcuts` (Code|File > Preferences > Keyboard Shortcuts) 

Give your macros names that briefly describe what they do.

## Add Keybindings to Run your Macros

in `keybindings.json` (Code|File > Preferences > Keyboard Shortcuts) add bindings to your macros:

```json
{
  "key": "ctrl+cmd+/",
  "command": "macros.commentDown"
}
```

Notice that `macros.my_macro_name` has to match what you named your macro. 

## Passing Arguments to Commands

Many commands accept arguments, like the "type" command which lets you insert text into the editor. For these cases use an object instead of a string when specifying the command to call in your `settings.json`:

```json
"macros": {
  "addSemicolon": [
    "cursorEnd",
      {"command": "type", "args": {"text": ";"}}
  ]
}
```

## Executing Snippets as part of a Macro

Macros can also execute any of your snippets which is super neat. Just insert the same text that you would normally type for the snippet, followed by the `insertSnippet` command:

```json
"macros": {
  "doMySnippet": [
    {"command": "type", "args": {"text": "mySnippetPrefixHere"}},
    "insertSnippet"
  ]
}
```

## License
MIT

## Known Issues

You can create macros that call them selves, thus creating infinite loops.
There is no security checking or any elaborate error feedback, so you can fuck things up badly (the evils of eval).
With power comes responsebility ;)

## Release Notes

### 1.0.0

Initial release of do

### TODO

- [ ] use for autoruns onDidChangeWorkspaceFolders
- [ ] remove terminals before create new
- [ ] make all things disposable
- [ ] documentation
- [ ] check async seriality
- [ ] pass on results to next func?
- [ ] pass filename to run easily scripts
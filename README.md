# Do

Brings simple but powerful custom keycommands, macros and autostart services to VS Code.
(Re)written by [Jan Manue Schlieper](http://audio.d3ck.net/about)
Inspired by the <3 of [geddski](http://gedd.ski)

## Intro

### quick and dirty keyboard actions

```javascript
{
    "key": "ctrl+cmd+a",
    "command": "do",
    "args": "echo 'Hello Terminal!'" //uses terminal to execute by default, assuming "do.defaultType":"terminal" (default)
}
```

### combine actions to macros (4 commands in series)

```javascript
{
    "key": "ctrl+cmd+b",
    "command": "do",
    "args": [
        {
            "type": "shell",
            "command": "echo 'this will be executed in the backgorund (child_process.execSync)'"
        },
        "echo 'Hello Terminal!'", //same as 1st example
        {
            "type": "terminal",
            "command": "echo 'another, more explixit way of saying Hello Terminal!'"
        },
        "workbench.action.files.openFileFolder" //call a vscode command
    ]
}
```

### define macros for use inside other actions/macros (User Settings)

```javascript
//define actions as Macros that you can access by their name, e.g. "showCurrentFileInFinder"
{
"do.macros": { 
    "showCurrentFileInFinder":{
      "type":"shell",
      "command":"open ${fileDirname}" // ${fileDirname} will resolve to the currently opened file's directory
    },
}
```

useage:

```javascript
//use macro
{
    "key": "ctrl+cmd+a",
    "command": "do",
    "args": "showCurrentFileInFinder"
}
```

## about simple string actions

```javascript
{
    "key": "ctrl+cmd+a",
    "command": "do",
    "args": "echo 'Hello Terminal!'" //uses terminal to execute by default, assuming "do.defaultType":"terminal" (default)
}
```

As we have learned, actions can be defined either as an `array` (a list of actions), an `object`d
 (a specific type of action) or by simple `string`.
`string` actions are shorthands for regular actions and will be resolved in the following order:

1. check if `string` matches a `macro`'s name and run the `macro`.
2. check if `string` is a `vscode command` and run that command.
3. use the `default action type` ("do.defaultType":["terminal"]) and create a regular action and use the `string` as the command.

## array actions and macros

If you define an array, the array will be iterated and all actains inside it will be executed.
You can nested arrays to your hearts content, keep in mind that you can create circular actions and crash your app.

## available action types

### terminal

Terminals are reused each time the action is invoked

```json
{
  "type":"terminal",
  "command":"do something in the internal terminal!"
}
```

### shell

similar to terminal, but executed in the background

```javascript
{
  "type":"shell",
  "command":[ //all commands can be multilines and will be concatinated with a new line (\n) before execution
    "do something in the invisible shell! (child_process.execSync)",
    "do something else in the invisible shell! ",
    ]
}
```

### eval

execute any code you can imagine inside the vscode environment.
Aside from the regular node environment you can also use vscodes extension api.

```javascript
{
  "type":"eval",
  "command":[
      "var fs = require('fs')",
      "var path = require('path')",
      "var someJavascript = 'executed in the node.js environment of vscode'",
      "fs.writeFileSync(path.join(${fileDirname},"someFilename.txt"),someJavascript)"
  ]
}
```

## Settings

settings:

```json
"do.defaultType":"terminal", // the default
"do.macros": { //define actions as Macros that you can access by their name, e.g. "showCurrentFileInFinder"
    "showCurrentFileInFinder":{
      "type":"shell",
      "command":"open ${fileDirname}"
    },
},
"do.onStart":[

]
```

## more Key Command examples

run "echo 'hello world'" in terminal.

```javascript
[{
        "key": "ctrl+cmd+a",
        "command": "do",
        "args": "echo 'Hello Terminal!'" //uses terminal to execute by default, assuming "do.defaultType":"terminal" (default)
    },
    {
        "key": "ctrl+cmd+b",
        "command": "do",
        "args": {
            "type": "shell",
            "command": "open ${fileDirname}" //opens the directory of the current file in finder (OSX), without shoeing the command in terminal 
        }
    },
    {
        "key": "ctrl+cmd+d",
        "command": "do",
        "args": "showCurrentFileInFinder" //use defined macros
    },
    {
       "key": "ctrl+cmd+e",
        "command": "do",
        "args": [ // perform multiple actions, combine and structure as you please:
          "echo 'Hello World!'",
          {
            "type":"eval",
            "command":[
              "require('child_process').execSync('echo 'Hello World via node!'')"
            ]
          },
          "echo 'Hello World 2!",
          "showCurrentFileInFinder"

        ]
    }
]
```

## Executing Snippets as part of a Macro

Macros can also execute any of your snippets which is super neat. Just insert the same text that you would normally type for the snippet, followed by the `insertSnippet` command:

```javascript
"macros": {
    "doMySnippet": [
        { "command": "type", "args": { "text": "mySnippetPrefixHere" } },
        "insertSnippet"
    ]
}
```

## License

MIT

## Known Issues

- You can create macros that call them selves, thus creating infinite loops.
- There is no security checking or any elaborate error feedback, so you can fuck things up badly (the evils of eval).

With power comes responsebility ;)

## Release Notes

### 1.0.0

Initial release of Do

### TODO
- [ ] switch: language
- [ ] focus last terminal and clear before reuse
- [ ] remove terminals before create new ones
- [ ] add simple watchers
- [ ] use for autoruns onDidChangeWorkspaceFolders ?
- [ ] make things disposable (save resources)
- [ ] better documentation
- [x] check async seriality
- [ ] pass on results to next func?
- [x] pass filename to commands
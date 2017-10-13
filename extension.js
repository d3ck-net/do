const vscode = require('vscode');
const async = require('async');
const cp = require('child_process');
const fs = require('fs');
const path = require('path');
function resolveConfigVars(input) {
    // "${workspaceFolder}" - the path of the folder opened in VS Code
    // ${workspaceRootFolderName} - the name of the folder opened in VS Code without any slashes (/)
    const map = {
        "${file}": vscode.window.activeTextEditor.document.fileName
    };

    Object.keys(map).forEach(needle => {
      const replace = map[needle];
      input = input.split(needle).join(replace);
    })
    // ${relativeFile} - the current opened file relative to workspaceRoot
    // ${fileBasename} - the current opened file's basename
    // ${fileBasenameNoExtension} - the current opened file's basename with no file extension
    // ${fileDirname} - the current opened file's dirname
    // ${fileExtname} - the current opened file's extension
    // ${cwd} - the task runner's current working directory on startup
    // ${lineNumber} 
    return input;
}

let settings = {};

vscode.window.onDidCloseTerminal(function({ action }) {
    delete action.terminal;
});

function dispatchAcionList(list, args, done, allCommands) {
    let jobs = [];
    if (!allCommands) {
        jobs.push(done => {
            vscode.commands.getCommands().then(newAllCommands => {
                allCommands = newAllCommands;
                done();
            })
        })
    }

    list.forEach(action => {
        jobs.push(done => dispatchAction(action, done, args, allCommands));
    })
    if (done) {
        jobs.push(done);
    }

    async.series(jobs);
}

function dispatchAction(action, done, args, allCommands) {

    if (Array.isArray(action)) {
        dispatchAcionList(action, args, done, allCommands);
    } else if (typeof action === 'string') {
        if (settings.macros[action]) {
            dispatchAction(settings.macros[action], done, args, allCommands);
        } else if (allCommands.indexOf(action) >= 0) {
            vscode.commands.executeCommand(action).then(done);
        } else {
            const type = settings.defaultType ||  "eval";
            dispatchAction({ type, command: action }, done, args, allCommands);
        }
    } else if (typeof action === "object") {
        if (!action.command) {
            vscode.window.showErrorMessage("do: action objects need a command:" + JSON.stringify(action));
        }
        else
        {
          action.command = Array.isArray(action.command) ?
            action.command.join('\n') :
            action.command;
          action.command = resolveConfigVars(action.command);
        }
        if (action.type === 'shell') {
            cp.exec(action.command).on('exit', done);
        } else if (action.type === 'terminal') {
            action.terminal = action.terminal || vscode.window.createTerminal("macro:" + action.command);
            action.terminal.action = action;
            action.terminal.show();
            action.terminal.sendText(action.command);
            done();
            return Promise.resolve()
        } else if (action.type === 'eval') {
            eval(action.command);
            done()
        } else if (action.type === 'task') {
            try {
                const wsf = vscode.workspace.getWorkspaceFolder();
                const p = path.join(wsf,".vscode","tasks.json");
                const text = fs.readFileSync(p,"utf8");
            }
            catch(e){

                vscode.window.showErrorMessage("do: not tasks defined");
             }
            vscode.workspace.
            debugger
        } else {
            vscode.commands.executeCommand(action.command, action.args).then(done);
        }
    }
}

function startup() {

    dispatchAcionList(settings.onStart);
}

const loadSettings = () => {
    settings = vscode.workspace.getConfiguration('do');

};
vscode.workspace.onDidChangeConfiguration(loadSettings)

function activate() {

    vscode.commands.registerCommand('do', function(args) {
        const argArray = Array.isArray(args) ? args : [args];
        dispatchAcionList(argArray)
    });

    loadSettings();
    startup();

}
exports.activate = activate;

function deactivate() {}

exports.deactivate = deactivate;
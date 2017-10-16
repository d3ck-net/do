const vscode = require('vscode');
const async = require('async');
const cp = require('child_process');
const path = require('path');
let settings = {};
let tempActions = {};
let allCommands = {};

function loadCommands(done) {
    vscode.commands.getCommands().then(newAllCommands => {
        allCommands = newAllCommands;
        if (done) {
            done();
        }
    })
}

function resolveConfigVars(input) {
    const map = {
        "${file}": vscode.window.activeTextEditor.document.fileName,
        "${fileDirname}": path.dirname(vscode.window.activeTextEditor.document.fileName),
        "${workspaceFolder}": vscode.workspace.rootPath ? vscode.workspace.rootPath : "."
    };
    Object.keys(map).forEach(needle => {
        const replace = map[needle];
        input = input.split(needle).join(replace);
    })
    return input;
}

function dispatchAcionList(list, done) {
    let jobs = [];
    if (!allCommands) {
        jobs.push(loadCommands);
    }
    list.forEach(action => {
        jobs.push(done => dispatchAction(action, done));
    })
    if (done) {
        jobs.push(done);
    }
    async.series(jobs);
}

function dispatchAction(action, done) {
    if (Array.isArray(action)) {
        dispatchAcionList(action, done);
    } else if (typeof action === 'string') {
        if (settings.macros[action]) {
            dispatchAction(settings.macros[action], done);
        } else if (allCommands.indexOf(action) >= 0) {
            vscode.commands.executeCommand(action).then(done);
        } else {
            const type = settings.defaultType ||  "eval";
            tempActions[action] = tempActions[action] || { type, command: action };
            dispatchAction(tempActions[action], done);
        }
    } else if (typeof action === "object") {
        dispatchActionObject(action);
    }
}

function dispatchActionObject(action, done) {
    if (!action.command) {
        vscode.window
            .showErrorMessage("do: action objects need a command:" + JSON.stringify(action))
            .then(done);
    } else {
        action.command = Array.isArray(action.command) ?
            action.command.join('\n') :
            action.command;
        action.command = resolveConfigVars(action.command);
    }
    switch (action.type) {
        case 'shell':
            cp.exec(action.command).on('exit', done);
            break;
        case 'terminal':
            action.terminal = action.terminal || vscode.window.createTerminal("do:" + action.command);
            action.terminal.action = action;
            action.terminal.show();
            action.terminal.sendText(action.command);
            done();
            break;
        case 'eval':
            eval(action.command);
            done()
            break;
        case 'task':
            dispatchAction({
                type: 'command',
                command: 'workbench.action.tasks.runTask',
                args: 'action.command'
            }, done);
            break;
        case 'alert':
            vscode.window.showErrorMessage(action.command)
                .then(done);
        case 'command':
        default:
            vscode.commands.executeCommand(action.command, action.args).then(done);
    }
}

function startup() {
    dispatchAction(settings.onStart);
}

function loadSettings() {
    settings = vscode.workspace.getConfiguration('do');
};

function activate() {
    loadSettings();
    startup();
    vscode.commands.registerCommand('do', function(args) {
        dispatchAction(args)
    });
}
exports.activate = activate;
vscode.workspace.onDidChangeConfiguration(loadSettings);
vscode.window.onDidCloseTerminal(function({ action }) {
    delete action.terminal;
});
//  - the path of the folder opened in VS Code
// ${workspaceRootFolderName} - the name of the folder opened in VS Code without any slashes (/)
// ${relativeFile} - the current opened file relative to workspaceRoot
// ${fileBasename} - the current opened file's basename
// ${fileBasenameNoExtension} - the current opened file's basename with no file extension
// ${fileExtname} - the current opened file's extension
// ${cwd} - the task runner's current working directory on startup
// ${lineNumber}
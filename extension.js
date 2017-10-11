const vscode = require('vscode');
const async = require('async');
const cp = require('child_process');
var activeContext;
var disposables = [];

vscode.window.onDidCloseTerminal(function({ action }) {
  delete action.terminal;
});

function dispatchAcionList(list, args) {
  vscode.commands.getCommands().then(allCommands => {

    let jobs = [];
    list.forEach(action => {
      jobs.push(done => dispatchAction(action,done,args, allCommands));
    })
    async.series(jobs);
  })
}

function dispatchAction(action,done,args,allCommands) {

  if (typeof action === 'string') {
    if (allCommands.indexOf(action) >= 0) {
      vscode.commands.executeCommand(action).then(done);
    } else {
      const settings = vscode.workspace.getConfiguration('macro');
      const type = settings.defaultType || "eval";
      dispatchAction({type,done,args,command:action});
    }
  } else if (typeof action === "object") {
    if (action.type === 'shell') {
      cp.exec(action.command).on('exit',done);
    } else if (action.type === 'terminal') {
      action.terminal = action.terminal || vscode.window.createTerminal("macro:" + action.command);
      action.terminal.action = action;
      action.terminal.show();
      action.terminal.sendText(action.command);
      done();
      return Promise.resolve()
    } else if (action.type === 'eval') {
      const script = Array.isArray(action.command) ?
        action.command.join('\n') :
        action.command;
      eval(script);
      done()
    } else {
      vscode.commands.executeCommand(action.command, action.args).then(done);
    }
  }
}

function activate(context) {

  vscode.commands.registerCommand(`macro`, function(args) {
    const argArray = Array.isArray(args) ? args : [args];
    dispatchAcionList(argArray)
  });

  loadMacros(context);
  activeContext = context;
  vscode.workspace.onDidChangeConfiguration(() => {
    disposeMacros();
    loadMacros(activeContext);
  });
}
exports.activate = activate;

function deactivate() {}

exports.deactivate = deactivate;

function loadMacros(context) {
  const settings = vscode.workspace.getConfiguration('macros');
  const macros = Object.keys(settings).filter((prop) => {
    return prop !== 'has' && prop !== 'get' && prop !== 'update';
  });

  macros.forEach((name) => {
    const disposable = vscode.commands.registerCommand(`macros.${name}`, function(args) {
      const argArray = Array.isArray(settings[name]) ? settings[name] : [settings[name]]
      dispatchAcionList(,args);
    })
    context.subscriptions.push(disposable);
    disposables.push(disposable);
  });
}

function disposeMacros() {
  for (var disposable of disposables) {
    disposable.dispose();
  }
}
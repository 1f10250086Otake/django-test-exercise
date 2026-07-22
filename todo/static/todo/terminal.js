const output = document.getElementById('terminalOutput');
const form = document.getElementById('terminalForm');
const input = document.getElementById('terminalInput');
const prompt = document.getElementById('terminalPrompt');

const fileSystem = {
  type: 'directory',
  children: {
    home: {
      type: 'directory',
      children: {
        guest: {
          type: 'directory',
          children: {
            'readme.txt': {
              type: 'file',
              content: 'Welcome to the browser terminal. Type help to see available commands.'
            },
            'notes.txt': {
              type: 'file',
              content: 'This virtual file system is stored only in memory.'
            },
            projects: {
              type: 'directory',
              children: {}
            }
          }
        }
      }
    },
    tmp: {
      type: 'directory',
      children: {}
    }
  }
};

let currentPath = '/home/guest';
const history = [];
let historyIndex = 0;

function normalizePath(path) {
  const parts = path.startsWith('/') ? [] : currentPath.split('/').filter(Boolean);

  path.split('/').forEach(function(part) {
    if (!part || part === '.') {
      return;
    }
    if (part === '..') {
      parts.pop();
    } else {
      parts.push(part);
    }
  });

  return '/' + parts.join('/');
}

function getNode(path) {
  const normalized = normalizePath(path);
  const parts = normalized.split('/').filter(Boolean);
  let node = fileSystem;

  for (const part of parts) {
    if (node.type !== 'directory' || !node.children[part]) {
      return null;
    }
    node = node.children[part];
  }

  return node;
}

function getParent(path) {
  const normalized = normalizePath(path);
  const parts = normalized.split('/').filter(Boolean);
  const name = parts.pop();
  const parentPath = '/' + parts.join('/');

  return {
    name: name,
    node: getNode(parentPath)
  };
}

function writeLine(text, className) {
  const line = document.createElement('div');
  line.className = 'terminal-line' + (className ? ' ' + className : '');
  line.textContent = text;
  output.appendChild(line);
  output.scrollTop = output.scrollHeight;
}

function writeError(text) {
  writeLine(text, 'terminal-error');
}

function updatePrompt() {
  prompt.textContent = 'guest@browser:' + currentPath + '$';
}

function requirePath(command, args) {
  if (!args[0]) {
    writeError(command + ': missing operand');
    return false;
  }
  return true;
}

const commands = {
  help: function() {
    writeLine('Available commands: help clear pwd ls cd mkdir touch cat echo rm whoami date');
  },
  clear: function() {
    output.replaceChildren();
  },
  pwd: function() {
    writeLine(currentPath);
  },
  ls: function(args) {
    const path = args[0] || currentPath;
    const node = getNode(path);

    if (!node) {
      writeError('ls: cannot access ' + path + ': No such file or directory');
    } else if (node.type === 'file') {
      writeLine(normalizePath(path).split('/').pop());
    } else {
      writeLine(Object.keys(node.children).sort().join('  '));
    }
  },
  cd: function(args) {
    const path = args[0] || '/home/guest';
    const node = getNode(path);

    if (!node) {
      writeError('cd: ' + path + ': No such file or directory');
    } else if (node.type !== 'directory') {
      writeError('cd: ' + path + ': Not a directory');
    } else {
      currentPath = normalizePath(path);
      updatePrompt();
    }
  },
  mkdir: function(args) {
    if (!requirePath('mkdir', args)) {
      return;
    }
    const parent = getParent(args[0]);
    if (!parent.name || !parent.node || parent.node.type !== 'directory') {
      writeError('mkdir: cannot create directory ' + args[0] + ': No such file or directory');
    } else if (parent.node.children[parent.name]) {
      writeError('mkdir: cannot create directory ' + args[0] + ': File exists');
    } else {
      parent.node.children[parent.name] = {type: 'directory', children: {}};
    }
  },
  touch: function(args) {
    if (!requirePath('touch', args)) {
      return;
    }
    const parent = getParent(args[0]);
    if (!parent.name || !parent.node || parent.node.type !== 'directory') {
      writeError('touch: cannot touch ' + args[0] + ': No such file or directory');
    } else if (parent.node.children[parent.name] && parent.node.children[parent.name].type === 'directory') {
      writeError('touch: cannot touch ' + args[0] + ': Is a directory');
    } else if (!parent.node.children[parent.name]) {
      parent.node.children[parent.name] = {type: 'file', content: ''};
    }
  },
  cat: function(args) {
    if (!requirePath('cat', args)) {
      return;
    }
    const node = getNode(args[0]);
    if (!node) {
      writeError('cat: ' + args[0] + ': No such file or directory');
    } else if (node.type !== 'file') {
      writeError('cat: ' + args[0] + ': Is a directory');
    } else {
      writeLine(node.content);
    }
  },
  echo: function(args) {
    writeLine(args.join(' '));
  },
  rm: function(args) {
    if (!requirePath('rm', args)) {
      return;
    }
    const parent = getParent(args[0]);
    const node = parent.node && parent.node.children[parent.name];
    if (!node) {
      writeError('rm: cannot remove ' + args[0] + ': No such file or directory');
    } else if (node.type === 'directory' && Object.keys(node.children).length > 0) {
      writeError('rm: cannot remove ' + args[0] + ': Directory not empty');
    } else {
      delete parent.node.children[parent.name];
    }
  },
  whoami: function() {
    writeLine('guest');
  },
  date: function() {
    writeLine(new Date().toString());
  }
};

function runCommand(commandLine) {
  const parts = commandLine.trim().split(/\s+/);
  const command = parts.shift();

  if (!command) {
    return;
  }
  if (!commands[command]) {
    writeError(command + ': command not found');
    return;
  }
  commands[command](parts);
}

form.addEventListener('submit', function(event) {
  event.preventDefault();
  const commandLine = input.value;

  if (commandLine.trim()) {
    writeLine(prompt.textContent + ' ' + commandLine, 'terminal-command');
    history.push(commandLine);
    historyIndex = history.length;
    runCommand(commandLine);
  }

  input.value = '';
  input.focus();
});

input.addEventListener('keydown', function(event) {
  if (event.key === 'ArrowUp' && historyIndex > 0) {
    event.preventDefault();
    historyIndex -= 1;
    input.value = history[historyIndex];
  } else if (event.key === 'ArrowDown' && historyIndex < history.length) {
    event.preventDefault();
    historyIndex += 1;
    input.value = historyIndex === history.length ? '' : history[historyIndex];
  }
});

writeLine('Browser Terminal Emulator');
writeLine('Type help to see available commands.');
updatePrompt();

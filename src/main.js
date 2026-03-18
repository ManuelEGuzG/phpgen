// main.js — PHPGen v2.0

var $ = function(id) { return document.getElementById(id); };

var generateBtn   = $('generate-btn');
var resetBtn      = $('reset-btn');
var outputSection = $('output-section');
var configCard    = $('config-card');
var treePreview   = $('tree-preview');
var commandsList  = $('commands-list');
var envPreview    = $('env-preview');
var urlsGrid      = $('urls-grid');
var copyAllBtn    = $('copy-all-btn');
var copyEnvBtn    = $('copy-env-btn');
var infoBar       = $('info-bar');
var toast         = $('toast');

// ── TOAST ──
var toastTimer;
function showToast() {
  toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function() { toast.classList.add('hidden'); }, 2000);
}

// ── COPY ──
function copyText(text, btn) {
  function markUsed() {
    if (btn) {
      var item = btn.closest('.cmd-item');
      if (item) {
        item.classList.add('cmd-used');
        var prompt = item.querySelector('.cmd-prompt');
        if (prompt) prompt.textContent = '✓';
      }
      btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
      btn.style.color = 'var(--green)';
    }
    showToast();
  }
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(markUsed).catch(function() { fallbackCopy(text, markUsed); });
  } else {
    fallbackCopy(text, markUsed);
  }
}

function fallbackCopy(text, cb) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
  document.body.appendChild(ta);
  ta.focus(); ta.select();
  try { document.execCommand('copy'); } catch(e) {}
  document.body.removeChild(ta);
  if (cb) cb();
}

// ── HELPERS ──
function getType() { return document.querySelector('input[name="project-type"]:checked').value; }
function getDB()   { return document.querySelector('input[name="db-type"]:checked').value; }

function slugify(s) {
  return s.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}
function dbSlug(s) {
  return s.trim().toLowerCase().replace(/[\s-]+/g, '_').replace(/[^a-z0-9_]/g, '');
}

// ── DB CONFIG MAP ──
var dbConfig = {
  mysql:  { conn: 'mysql',  host: '127.0.0.1', port: '3306',  user: 'root',     pass: '' },
  sqlite: { conn: 'sqlite', host: '',          port: '',       user: '',         pass: '' },
  pgsql:  { conn: 'pgsql',  host: '127.0.0.1', port: '5432',  user: 'postgres', pass: 'tu_password' },
  sqlsrv: { conn: 'sqlsrv', host: 'localhost',  port: '1433',  user: 'sa',       pass: 'tu_password' },
  none:   { conn: '',       host: '',          port: '',       user: '',         pass: '' },
};

// ── TREE ──
function buildTree(cfg) {
  var lines = [];
  var name  = cfg.name;
  var type  = cfg.type;

  if (type === 'php-puro') {
    lines = [
      { i:0, p:'',    n: name+'/',           c:'is-folder', t:'# Raíz del proyecto' },
      { i:1, p:'├─ ', n: 'public/',          c:'is-folder', t:'# Carpeta pública (htdocs)' },
      { i:2, p:'├─ ', n: 'index.php',        c:'is-php',    t:'# Entrada principal' },
      { i:2, p:'├─ ', n: 'css/',             c:'is-folder', t:'' },
      { i:2, p:'└─ ', n: 'js/',              c:'is-folder', t:'' },
      { i:1, p:'├─ ', n: 'src/',             c:'is-folder', t:'# Clases PHP' },
      { i:1, p:'├─ ', n: 'config/',          c:'is-folder', t:'# Configuración' },
      { i:2, p:'└─ ', n: 'database.php',     c:'is-php',    t:'# Conexión BD' },
      { i:1, p:'├─ ', n: 'views/',           c:'is-folder', t:'# Plantillas HTML/PHP' },
      { i:1, p:'├─ ', n: '.env',             c:'is-env',    t:'# Variables de entorno' },
      { i:1, p:'├─ ', n: '.gitignore',       c:'is-file',   t:'' },
      { i:1, p:'└─ ', n: 'README.md',        c:'is-file',   t:'' },
    ];
  } else {
    lines = [
      { i:0, p:'',    n: name+'/',              c:'is-folder', t:'# Proyecto Laravel' },
      { i:1, p:'├─ ', n: 'app/',               c:'is-folder', t:'# Lógica principal' },
      { i:2, p:'├─ ', n: 'Http/Controllers/',  c:'is-folder', t:'# Controladores' },
      { i:2, p:'└─ ', n: 'Models/',            c:'is-folder', t:'# Modelos Eloquent' },
      { i:1, p:'├─ ', n: 'database/',          c:'is-folder', t:'# Migraciones y seeders' },
      { i:1, p:'├─ ', n: 'public/',            c:'is-folder', t:'# Assets públicos' },
      { i:1, p:'├─ ', n: 'resources/',         c:'is-folder', t:'# Vistas y assets' },
      { i:2, p:'└─ ', n: 'views/',             c:'is-folder', t:'# Blade templates' },
      { i:1, p:'├─ ', n: 'routes/',            c:'is-folder', t:'# Rutas' },
      { i:2, p:'├─ ', n: 'web.php',            c:'is-php',    t:'# Rutas web' },
      { i:2, p:'└─ ', n: 'api.php',            c:'is-php',    t:'# Rutas API' },
      { i:1, p:'├─ ', n: '.env',               c:'is-env',    t:'# Variables de entorno' },
      { i:1, p:'├─ ', n: 'artisan',            c:'is-php',    t:'# CLI de Laravel' },
      { i:1, p:'└─ ', n: 'composer.json',      c:'is-file',   t:'# Dependencias' },
    ];
  }

  treePreview.innerHTML = lines.map(function(l) {
    var pad = '';
    for (var i = 0; i < l.i; i++) pad += '\u00a0\u00a0\u00a0';
    return '<div class="tree-line">'
      + '<span class="tree-indent">' + pad + l.p + '</span>'
      + '<span class="tree-name ' + l.c + '">' + l.n + '</span>'
      + (l.t ? '<span class="tree-comment">' + l.t + '</span>' : '')
      + '</div>';
  }).join('');
}

// ── HIGHLIGHT ──
function highlightCmd(cmd) {
  var safe = cmd.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  safe = safe.replace(/^(cd|mkdir|php|composer|laravel|git|New-Item|echo|copy|code|npm|npx|psql)\b/, '<span class="kw">$1</span>');
  safe = safe.replace(/(\s--?[\w:-]+)/g, '<span class="flag">$1</span>');
  safe = safe.replace(/&quot;(.*?)&quot;/g, '<span class="val">"$1"</span>');
  return safe;
}

// ── COMMANDS ──
function buildCommands(cfg) {
  var groups = [];
  var name   = cfg.name;
  var type   = cfg.type;
  var db     = cfg.db;
  var dbName = cfg.dbName || name.replace(/-/g, '_');
  var user   = cfg.user;
  var dbc    = dbConfig[db] || dbConfig.none;

  // ── PHP PURO ──
  if (type === 'php-puro') {
    var mkCmds = [
      'mkdir ' + name,
      'cd ' + name,
      'mkdir public',
      'mkdir public\\css',
      'mkdir public\\js',
      'mkdir src',
      'mkdir config',
      'mkdir views',
      'New-Item public\\index.php',
      'New-Item config\\database.php',
      'New-Item .env',
      'New-Item .gitignore',
    ];
    if (cfg.readme) mkCmds.push('New-Item README.md');
    if (cfg.vscode) mkCmds.push('code .');
    groups.push({ title: 'Crear estructura de carpetas', cmds: mkCmds });

    if (db !== 'none') {
      var composerCmds = [
        'composer init --no-interaction --name="' + (cfg.author || 'dev') + '/' + name + '"',
        'composer require vlucas/phpdotenv',
        '# Agrega autoload en composer.json y ejecuta:',
        'composer dump-autoload',
      ];
      if (db === 'pgsql') composerCmds.push('# Instala el driver PDO pgsql en php.ini de XAMPP');
      if (db === 'sqlsrv') composerCmds.push('# Instala ODBC Driver 17/18 y habilita php_sqlsrv en php.ini');
      groups.push({ title: 'Composer · gestión de dependencias', cmds: composerCmds });
    }

  // ── LARAVEL ──
  } else {
    groups.push({ title: 'Crear proyecto Laravel', cmds: [
      'composer create-project laravel/laravel ' + name,
      'cd ' + name,
    ]});

    if (type === 'laravel-breeze') {
      groups.push({ title: 'Instalar Laravel Breeze · autenticación', cmds: [
        'composer require laravel/breeze --dev',
        'php artisan breeze:install blade',
        'npm install',
        'npm run build',
      ]});
    }

    if (type === 'laravel-api') {
      groups.push({ title: 'Instalar Laravel Sanctum · API tokens', cmds: [
        'composer require laravel/sanctum',
        'php artisan vendor:publish --provider="Laravel\\Sanctum\\SanctumServiceProvider"',
        '# Agrega HasApiTokens al modelo User',
        'php artisan migrate',
      ]});
    }

    // BD
    if (db === 'mysql') {
      groups.push({ title: 'Configurar MySQL · XAMPP', cmds: [
        '# Asegúrate de tener XAMPP con MySQL iniciado',
        '# Edita el .env generado en el paso 04',
        'php artisan migrate',
      ]});
    } else if (db === 'sqlite') {
      groups.push({ title: 'Configurar SQLite', cmds: [
        'New-Item database\\database.sqlite',
        '# Edita el .env: DB_CONNECTION=sqlite',
        '# Comenta o elimina las otras líneas DB_*',
        'php artisan migrate',
      ]});
    } else if (db === 'pgsql') {
      groups.push({ title: 'Configurar PostgreSQL', cmds: [
        '# Instala PostgreSQL: https://www.postgresql.org/download/',
        '# Crea la base de datos:',
        'psql -U postgres -c "CREATE DATABASE ' + dbName + ';"',
        '# Edita el .env generado en el paso 04',
        'php artisan migrate',
      ]});
    } else if (db === 'sqlsrv') {
      groups.push({ title: 'Configurar SQL Server', cmds: [
        '# Instala ODBC Driver 17 o 18 para SQL Server',
        '# Habilita php_sqlsrv y php_pdo_sqlsrv en php.ini de XAMPP',
        '# Crea la BD en SQL Server Management Studio',
        '# Edita el .env generado en el paso 04',
        'php artisan migrate',
      ]});
    }

    // Artisan útiles
    groups.push({ title: 'Comandos Artisan útiles', cmds: [
      'php artisan serve',
      '# Crear controlador:',
      'php artisan make:controller NombreController',
      '# Crear modelo + migración:',
      'php artisan make:model Nombre -m',
      '# Crear seeder:',
      'php artisan make:seeder NombreSeeder',
      '# Crear request de validación:',
      'php artisan make:request NombreRequest',
      '# Limpiar caché:',
      'php artisan config:clear',
      'php artisan cache:clear',
      'php artisan route:clear',
    ]});

    if (cfg.vscode) {
      groups.push({ title: 'Abrir en VS Code', cmds: ['code .'] });
    }
  }

  // Git
  if (cfg.git) {
    var gitCmds = [
      'git init',
      'git branch -M main',
      'git config core.ignorecase false',
      'git add .',
      'git commit -m "feat: init ' + type + ' project"',
    ];
    if (user) {
      gitCmds.push('# Crea el repo en github.com primero, luego:');
      gitCmds.push('git remote add origin https://github.com/' + user + '/' + name + '.git');
      gitCmds.push('git push -u origin main');
    }
    groups.push({ title: 'Configurar Git', cmds: gitCmds });
  }

  // RENDER
  var html = '';
  groups.forEach(function(g) {
    html += '<div class="cmd-group"><div class="cmd-group-title">' + g.title + '</div>';
    g.cmds.forEach(function(cmd) {
      if (cmd.charAt(0) === '#') {
        html += '<div class="cmd-item cmd-comment">'
          + '<span class="cmd-prompt" style="color:var(--text-3)">#</span>'
          + '<span class="cmd-text"><span style="color:var(--text-3)">' + cmd.slice(2) + '</span></span>'
          + '</div>';
      } else {
        var encoded = cmd.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
        html += '<div class="cmd-item">'
          + '<span class="cmd-prompt">$</span>'
          + '<span class="cmd-text">' + highlightCmd(cmd) + '</span>'
          + '<button class="copy-cmd-btn" data-cmd="' + encoded + '" title="Copiar">'
          + '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>'
          + '</button></div>';
      }
    });
    html += '</div>';
  });

  commandsList.innerHTML = html;
  commandsList.querySelectorAll('.copy-cmd-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      copyText(this.getAttribute('data-cmd'), this);
    });
  });

  return groups;
}

// ── ENV ──
function buildEnv(cfg) {
  var name   = cfg.name;
  var type   = cfg.type;
  var db     = cfg.db;
  var dbName = cfg.dbName || name.replace(/-/g, '_');
  var dbc    = dbConfig[db] || dbConfig.none;
  var lines  = [];

  if (type === 'php-puro') {
    lines = [
      '# .env — ' + name,
      'APP_NAME="' + name + '"',
      'APP_ENV=local',
      'APP_DEBUG=true',
      '',
    ];
    if (db !== 'none' && db !== 'sqlite') {
      lines = lines.concat([
        'DB_CONNECTION=' + dbc.conn,
        'DB_HOST=' + dbc.host,
        'DB_PORT=' + dbc.port,
        'DB_DATABASE=' + dbName,
        'DB_USERNAME=' + dbc.user,
        'DB_PASSWORD=' + dbc.pass,
      ]);
    } else if (db === 'sqlite') {
      lines.push('DB_CONNECTION=sqlite');
    } else {
      lines.push('# Sin base de datos');
    }
  } else {
    lines = [
      'APP_NAME="' + name + '"',
      'APP_ENV=local',
      'APP_KEY=',
      'APP_DEBUG=true',
      'APP_URL=http://localhost:8000',
      '',
      'LOG_CHANNEL=stack',
      'LOG_LEVEL=debug',
      '',
    ];
    if (db === 'sqlite') {
      lines.push('DB_CONNECTION=sqlite');
      lines.push('# DB_DATABASE=database/database.sqlite');
    } else if (db !== 'none') {
      lines = lines.concat([
        'DB_CONNECTION=' + dbc.conn,
        'DB_HOST=' + dbc.host,
        'DB_PORT=' + dbc.port,
        'DB_DATABASE=' + dbName,
        'DB_USERNAME=' + dbc.user,
        'DB_PASSWORD=' + dbc.pass,
      ]);
    } else {
      lines.push('# Sin base de datos');
    }
    lines = lines.concat([
      '',
      'BROADCAST_DRIVER=log',
      'CACHE_DRIVER=file',
      'FILESYSTEM_DISK=local',
      'QUEUE_CONNECTION=sync',
      'SESSION_DRIVER=file',
      'SESSION_LIFETIME=120',
    ]);
    if (type === 'laravel-api') {
      lines = lines.concat(['', 'SANCTUM_STATEFUL_DOMAINS=localhost:3000']);
    }
  }

  var text = lines.join('\n');

  envPreview.innerHTML = lines.map(function(line) {
    if (!line) return '';
    if (line.startsWith('#')) return '<span class="env-comment">' + line + '</span>';
    var idx = line.indexOf('=');
    if (idx === -1) return line;
    var key = line.slice(0, idx);
    var val = line.slice(idx + 1);
    return '<span class="env-key">' + key + '</span>=' + (val ? '<span class="env-val">' + val + '</span>' : '');
  }).join('\n');

  return text;
}

// ── URLS ──
function buildUrls(cfg) {
  var items = [];
  var type  = cfg.type;
  var name  = cfg.name;
  var user  = cfg.user;

  if (type === 'php-puro') {
    items.push({ label: 'XAMPP local', url: 'http://localhost/' + name + '/public/', desc: 'Copia en htdocs/' + name });
  } else {
    items.push({ label: 'Artisan serve', url: 'http://localhost:8000', desc: 'php artisan serve' });
    items.push({ label: 'XAMPP htdocs', url: 'http://localhost/' + name + '/public/', desc: 'Copiar en htdocs/' + name });
  }
  if (user) {
    items.push({ label: 'GitHub', url: 'https://github.com/' + user + '/' + name, desc: 'Repositorio del proyecto' });
  }

  urlsGrid.innerHTML = items.map(function(item) {
    return '<div class="url-item">'
      + '<div class="url-label">' + item.label + '</div>'
      + '<a class="url-link" href="' + item.url + '" target="_blank">' + item.url + '</a>'
      + '<div class="url-desc">' + item.desc + '</div>'
      + '</div>';
  }).join('');
}

// ── INFO BAR ──
var typeLabels = {
  'php-puro':       '🐘 PHP Puro — estructura lista para XAMPP · sin framework',
  'laravel':        '🔴 Laravel — framework completo con Artisan, Eloquent y migraciones',
  'laravel-breeze': '🔐 Laravel + Breeze — autenticación lista (login, registro, dashboard)',
  'laravel-api':    '⚡ Laravel API REST — Sanctum para autenticación por tokens',
};
function buildInfoBar(type) {
  infoBar.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
    + '<span>' + (typeLabels[type] || type) + '</span>';
}

// ── GET ALL ──
function getAllCommands(groups) {
  return groups.map(function(g) {
    return '# ' + g.title + '\n' + g.cmds.join('\n');
  }).join('\n\n');
}

// ── GENERATE ──
generateBtn.addEventListener('click', function() {
  var cfg = {
    name:    slugify($('project-name').value.trim()) || 'mi-proyecto',
    dbName:  dbSlug($('db-name').value.trim()),
    author:  $('author-name').value.trim(),
    user:    $('github-user').value.trim(),
    type:    getType(),
    db:      getDB(),
    git:     $('include-git').checked,
    readme:  $('include-readme').checked,
    vscode:  $('open-vscode').checked,
  };

  buildInfoBar(cfg.type);
  buildTree(cfg);
  var groups  = buildCommands(cfg);
  var envText = buildEnv(cfg);
  buildUrls(cfg);

  copyAllBtn.onclick = function() { copyText(getAllCommands(groups), null); };
  copyEnvBtn.onclick = function() { copyText(envText, null); };

  outputSection.classList.remove('hidden');
  setTimeout(function() {
    outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 50);
});

// ── RESET ──
resetBtn.addEventListener('click', function() {
  $('project-name').value = '';
  $('db-name').value      = '';
  $('author-name').value  = '';
  $('github-user').value  = '';

  document.querySelector('input[name="project-type"][value="php-puro"]').checked = true;
  document.querySelector('input[name="db-type"][value="mysql"]').checked = true;

  $('include-git').checked    = true;
  $('include-readme').checked = true;
  $('open-vscode').checked    = true;

  outputSection.classList.add('hidden');
  configCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// ── AUTO SLUGIFY ──
$('project-name').addEventListener('blur', function() {
  if (this.value) this.value = slugify(this.value);
});
$('db-name').addEventListener('blur', function() {
  if (this.value) this.value = dbSlug(this.value);
});
var fs = require("fs"), spawn = require("child_process").spawn, slice = [].slice;

function die () {
  console.log.apply(console, slice.call(arguments, 0));
  process.exit(1);
}

function say () {
  console.log.apply(console, slice.call(arguments, 0));
}

var configuration = JSON.parse(fs.readFileSync("configuration.json"));

function extend (to) {
  for (var i = 1; i < arguments.length; i++) {
    for (var key in arguments[i]) {
      to[key] = arguments[i][key];
    }
  }
  return to;
}

function backup (configuration, destination, callback) {
  try {
    var parameters = [],
        options = { env: extend({}, process.env, { PGPASSWORD: configuration.password }) },
        pgdump;
    if (configuration.hostname) {
      parameters.push('-h', configuration.hostname);
    }
    parameters.push('-U', configuration.user) 
    if (!configuration.user) {
      throw new Error("database user is required");
    }
    parameters.push('-w');
    if (!configuration.name) {
      throw new Error("database name is required");
    }
    parameters.push(configuration.name);
    pgdump = spawn('pg_dump', parameters, options);
    var output = fs.createWriteStream(destination);
    pgdump.stdout.pipe(output);
    pgdump.stderr.on('data', function (chunk) {
      console.log(chunk.toString());
    });
    pgdump.on('close', function (code) {
      callback(null, code);
    });
  } catch (e) {
    callback(e);
  }
}

backup(configuration.databases.postgresql, "backup.dmp", function (error) {
  if (error) throw error;
});

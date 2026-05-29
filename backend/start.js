// Plain JS wrapper — no hoisting, error handlers registered before any require
process.stdout.write('>>> START.JS: process alive\n');

process.on('uncaughtException', function (err) {
  process.stdout.write('UNCAUGHT EXCEPTION: ' + (err ? err.message : 'unknown') + '\n');
  if (err && err.stack) process.stdout.write(err.stack + '\n');
  process.exit(1);
});

process.on('unhandledRejection', function (reason) {
  process.stdout.write('UNHANDLED REJECTION: ' + String(reason) + '\n');
  process.exit(1);
});

process.stdout.write('>>> START.JS: handlers registered, loading dist/main\n');

try {
  require('./dist/main');
} catch (e) {
  process.stdout.write('REQUIRE ERROR: ' + (e ? e.message : 'unknown') + '\n');
  if (e && e.stack) process.stdout.write(e.stack + '\n');
  process.exit(1);
}

process.stderr.write("[DBG] calling import REPL\n");
import("./screens/REPL.tsx")
  .then(() => {
    process.stderr.write("[DBG] import REPL resolved\n");
  })
  .catch((e) => {
    process.stderr.write("[DBG] import REPL error: " + e + "\n");
  });
process.stderr.write("[DBG] wait for macrotasks\n");
setTimeout(() => {
  process.stderr.write("[DBG] 6 sec timeout\n");
  process.exit(0);
}, 6000);

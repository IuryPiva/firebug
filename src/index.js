const { Command, flags } = require("@oclif/command");
const execa = require("execa");
const watch = require('node-watch');
const camelCase = require('camelcase')
const path = require('path')
const os = require('os')
const fs = require('fs')

function generateFunctionName(file) { 
  return camelCase(
    path.basename(path.dirname(file))
    .concat(
      '/',
      path.basename(
        file, 
        '.f'.concat(path.extname(file))
      )
    ).replace('/', '_')
  )
}

class FirebugCommand extends Command {
  async run() {
    const { args } = this.parse(FirebugCommand);
    const { functionName, dir } = args;
    this.log(functionName);

    switch (functionName) {
      case "start":
        this.exec("npx functions start");
        break;
      case "stop":
        this.exec("npx functions stop");
        break;
      case "watch":
        if(os.platform() == 'linux') {
          watch(dir, { recursive: true } , async (eventType, filename) => {
            this.log(`Detected ${eventType} on ${filename}`);
            if(eventType == 'update' && filename.includes('.f.ts')) {
              await this.firebug(generateFunctionName(filename))
            }
          })
        } else {
          fs.watch(dir, { recursive: true } , async (eventType, filename) => {
            this.log(`Detected ${eventType} on ${filename}`);
            if(eventType == 'change' && filename.includes('.f.ts')) {
              await this.firebug(generateFunctionName(filename))
            }
          })
        }
        
        break;
      default:
        this.firebug(functionName)
    }
  }

  async exec(command) {
    this.log(command);
    const { stdout } = await execa.shell(command);
    this.log(stdout);
  }

  async firebug(functionName) {
    await this.exec(`npx functions deploy ${functionName} --trigger-http -t 10000s`);
    await this.exec(`npx functions inspect ${functionName}`);
  }
}
FirebugCommand.args = [{ name: "functionName" }, { name: "dir" }];

FirebugCommand.description = `Inspect firebase functions that run locally
...
Extra documentation goes here
`;

FirebugCommand.flags = {
  // add --version flag to show CLI version
  version: flags.version({ char: "v" }),
  // add --help flag to show CLI version
  help: flags.help({ char: "h" })
};

module.exports = FirebugCommand;

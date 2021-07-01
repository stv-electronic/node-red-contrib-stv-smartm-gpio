module.exports = function(RED) {
    "use strict";
    const execSync = require('child_process').execSync;
    const exec = require('child_process').exec;
    const spawn = require('child_process').spawn;
    const fs = require('fs');

    const testCommand = __dirname+'/testgpio.py'
    const gpioCommand = __dirname+'/gpio';
    let allOK = true;
    let pinsInUse = {};
    try {
        execSync(testCommand);
    } catch(err) {
        allOK = false;
        RED.log.warn("status-led : "+RED._("status-led.errors.ignorenode"));
    }
    if (RED.settings.verbose) 
       RED.log.info("STV status-led")
    // the magic to make python print stuff immediately
    process.env.PYTHONUNBUFFERED = 1;
    function stv(config) {
        RED.nodes.createNode(this,config);
        let context = this.context();
        let node = this;
        const pin="status-led"
        let getDataState = context.get('getDataState')||1;
        let statusColor = "green";
        let diagMsg = "Im Waiting";
        function inputlistener(msg, send, done) {
            if (msg.payload === "true") { msg.payload = true; }
            if (msg.payload === "false") { msg.payload = false; }
            var out = Number(msg.payload);
            if (RED.settings.verbose) { node.log("out: "+out); }
            if (node.child !== null) {
                node.child.stdin.write(out+"\n", () => {
                    if (done) { done(); }
                });
                node.status({fill:"green",shape:"dot",text:msg.payload.toString()});
            }
            else {
                node.error(RED._("status-led.errors.pythoncommandnotfound"),msg);
                node.status({fill:"red",shape:"ring",text:"status-led.status.not-running"});
            }
        }
        if (allOK === true) {
            if(config.initialstate == 'on')
            {
                node.child = spawn(gpioCommand, ["setstatus",1]);
                node.status({fill:"green",shape:"dot",text:"true"});
            }
            else if(config.initialstate == 'off')
            {
                node.child = spawn(gpioCommand, ["setstatus",0]);
                node.status({fill:"green",shape:"dot",text:"false"});
            }
            else
            {
                node.child = spawn(gpioCommand, ["setstatus"]);
            }
            node.running = true;
            node.status({fill:"green",shape:"dot",text:node.level});
            node.on("input", inputlistener);
            node.child.stdout.on('data', function (data) {
                if (RED.settings.verbose) { node.log("out: "+data+" :"); }
            });
            node.child.stderr.on('data', function (data) {
                if (RED.settings.verbose) { node.log("err: "+data+" :"); }
            });
            node.child.on('close', function (code) {
                node.child = null;
                node.running = false;
                if (RED.settings.verbose) { node.log(RED._("status-led.status.closed")); }
                if (node.finished) {
                    node.status({fill:"grey",shape:"ring",text:"status-led.status.closed"});
                    node.finished();
                }
                else { node.status({fill:"red",shape:"ring",text:"status-led.status.stopped"}); }
            });

            node.child.on('error', function (err) {
                if (err.errno === "ENOENT") { node.error(RED._("status-led.errors.commandnotfound")); }
                else if (err.errno === "EACCES") { node.error(RED._("status-led.errors.commandnotexecutable")); }
                else { node.error(RED._("status-led.errors.error")+': ' + err.errno); }
            });

        }
        else {
            node.warn(RED._("status-led.errors.invalidpin")+": "+node.pin);
        }
    }
    RED.nodes.registerType("status-led",stv);
};


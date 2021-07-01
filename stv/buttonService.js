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
        RED.log.warn("service-button : "+RED._("service-button.errors.ignorenode"));
    }
    if (RED.settings.verbose) 
       RED.log.info("STV service-button")
    // the magic to make python print stuff immediately
    process.env.PYTHONUNBUFFERED = 1;
    function stv(config) {
        RED.nodes.createNode(this,config);
        let context = this.context();
        let node = this;
        const pin="service-button"
        let getDataState = context.get('getDataState')||1;
        let statusColor = "green";
        let diagMsg = "Im Waiting";
        if (allOK === true) {
            node.child = spawn(gpioCommand, ["getservice"]);
            node.running = true;
            node.status({fill:"green",shape:"dot",text:"0"});
            node.send({ topic:"service-button", payload:0 });
            node.child.stdout.on('data', function (data) {
                var d = data.toString().trim().split("\n");
                for (var i = 0; i < d.length; i++) {
                    if (d[i] === '') { return; }
                    if (node.running && node.buttonState !== -1 && !isNaN(Number(d[i])) && node.buttonState !== d[i]) {
                        node.send({ topic:"service-button", payload:Number(d[i]) });
                    }
                    node.buttonState = d[i];
                    node.status({fill:"green",shape:"dot",text:d[i]});
                    if (RED.settings.verbose) { node.log("out: "+d[i]+" :"); }
                }
            });

            node.child.stderr.on('data', function (data) {
                if (RED.settings.verbose) { node.log("err: "+data+" :"); }
            });

            node.child.on('close', function (code) {
                node.running = false;
                node.child = null;
                if (RED.settings.verbose) { node.log(RED._("service-button.status.closed")); }
                if (node.finished) {
                    node.status({fill:"grey",shape:"ring",text:"service-button.status.closed"});
                    node.finished();
                }
                else { node.status({fill:"red",shape:"ring",text:"service-button.status.stopped"}); }
            });

            node.child.on('error', function (err) {
                if (err.errno === "ENOENT") { node.error(RED._("service-button.errors.commandnotfound")); }
                else if (err.errno === "EACCES") { node.error(RED._("service-button.errors.commandnotexecutable")); }
                else { node.error(RED._("service-button.errors.error",{error:err.errno})) }
            });
        }
        else {
            node.status({fill:"grey",shape:"dot",text:"service-button.status.not-available"});
            if (node.read === true) {
                var val;
                if (node.intype == "up") { val = 1; }
                if (node.intype == "down") { val = 0; }
                setTimeout(function() {
                    node.send({ topic:"pi/"+node.pin, payload:val });
                    node.status({fill:"grey",shape:"dot",text:RED._("service-button.status.na",{value:val})});
                },250);
            }
        }

        node.on("close", function(done) {
            node.status({fill:"grey",shape:"ring",text:"service-button.status.closed"});
            delete pinsInUse[node.pin];
            if (node.child != null) {
                node.finished = done;
                node.child.stdin.write("close "+node.pin);
                node.child.kill('SIGKILL');
            }
            else { done(); }
        });
    }
RED.nodes.registerType("service-button",stv);
};


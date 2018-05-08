var Invoices = artifacts.require("./Invoices");

module.exports = function (deployer) {
    deployer.deploy(Invoices);
};

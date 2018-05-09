var Invoices = artifacts.require('./Invoices')

contract('Invoices',function(accounts){
    var invoicesContract;
    var issuer = {
        account : accounts[1],
        name : "giwoong",
        email : "giwoong@crowdz.io"
    }
    var debtee = {
        account : accounts[2],
        name : "meit",
        email: "mmaheshwari@trellissoft.com"
    }
    var debtor = {
        account : accounts[3],
        name : "clay",
        email : "clay@crowdz.io"
    }

    Invoices.deployed().then(function(instance){
        invoicesContract = instance;
    })

    /*
     * Test on ganache env. Below are the tests 
     *  - create issuer, debtee, debtor.
     *  - createInvoice by issuer. On creation, issuer == debtee.
     *  - check invoice was created without problem
     *  - fundInvoice by a debtee who is paying money to issuer. From now, issuer != debtee
     *  - check invoice owner changed from issuer to debtee
     *  - PayInvoice by a debtor to debtee
     *  - check invoice is paid
     *  - check ether balance of contract
     */

    it('Create three users - issuer, debtee, debtor', async function(){

        Promise.all([invoicesContract.users(issuer.account),invoicesContract.users(debtee.account),invoicesContract.users(debtor.account)])
        .then(function(users){
            assert.equal(users[0][1],"","Issuer exists before creation!")
            assert.equal(users[1][1],"", "Debtee exists before creation!")
            assert.equal(users[2][1],"", "Debtor exists before creation!")
        })
        .catch(function(error){
            console.log(error)
        })

        try {
            await invoicesContract.createUser(issuer.account, issuer.name, issuer.email);
            await invoicesContract.createUser(debtee.account, debtee.name, debtee.email);
            await invoicesContract.createUser(debtor.account, debtor.name, debtor.email);
        } catch (error) {
            console.log(error)
        }
        
        Promise.all([invoicesContract.users(issuer.account), invoicesContract.users(debtee.account), invoicesContract.users(debtor.account)])
        .then(function (users) {
            assert.equal(users[0][1], "giwoong", "Issuer does not exist before creation!")
            assert.equal(users[1][1], "meit", "Debtee does not exist before creation!")
            assert.equal(users[2][1], "clay", "Debtor does not exist before creation!")
        })
        .catch(function (error) {
            console.log(error)
        })

    })


    it('Issuer created two invoices', async function () {
        var invoices = {
            first: {
                number: 1,
                issuer: issuer.account,
                debtee: issuer.account, // On creation, issuer == debtee
                debtor: debtor.account,
                dollarAmount: 2000,
                etherAmount: 2*10**18,
                timestamp: 1525832164563,
                paid: false
            },
            second: {
                number: 2,
                issuer: debtee.account, // Debtee issued invoice
                debtee: debtee.account,
                debtor: debtor.account,
                dollarAmount: 100,
                etherAmount: 10**18,
                timestamp: 1525832164568,
                paid: true
            }
        }

        try {
            await invoicesContract.createInvoice(invoices.first.number, invoices.first.issuer, invoices.first.debtee, invoices.first.debtor, invoices.first.dollarAmount, invoices.first.etherAmount, invoices.first.timestamp, invoices.first.paid);
            await invoicesContract.createInvoice(invoices.second.number, invoices.second.issuer, invoices.second.debtee, invoices.second.debtor, invoices.second.dollarAmount, invoices.second.etherAmount, invoices.second.timestamp, invoices.second.paid);
        } catch (error) {
            console.log(error)
        }

        Promise.all([invoicesContract.getInvoice(1), invoicesContract.getInvoice(2)])
            .then(function (invoices) {
                assert.equal(invoices[0][1], "giwoong", "Invoice issuer is not same as created!")
                assert.equal(invoices[1][1], "meit", "Invoice issuer is not same as created!")
            })
            .catch(function (error) {
                console.log(error)
            })

    })

    it('Meit funds ethers on first invoice on behalf of giwoong, who is issuer', async function () { // issuer != debtee
        var etherAmount = 2*10**18;
        var invoiceInfo = await invoicesContract.getInvoice(1);
        var debteeName = invoiceInfo[2];
        assert.equal(debteeName, "giwoong", "Invoice issuer giwoong is not a debtee of first invoice!");

        var issuerAddress = issuer.account;
        var issuerBalanceBeforeTx = await web3.fromWei(web3.eth.getBalance(issuerAddress).toNumber(),'ether');
        
        try {
            await invoicesContract.fundInvoice.sendTransaction(1, { from: debtee.account, value: etherAmount});
        } catch (error) {
            console.log(error)
        }

        issuerBalanceAfterTx = await web3.fromWei(web3.eth.getBalance(issuerAddress).toNumber(),'ether');
        assert.equal(issuerBalanceAfterTx,parseFloat(issuerBalanceBeforeTx)+2,"Balance of issuer not changed after fund Invoice!")

        invoiceInfo = await invoicesContract.getInvoice(1);
        debteeName = invoiceInfo[2];
        assert.equal(debteeName, "meit", "Invoice funder Meit doesn't become a new funder!")
    })

    it('Debtor clay pays debtee meit for the first invoice', async function () {
        var etherAmount = 2*10**18;
        var invoiceInfo = await invoicesContract.getInvoice(1);
        var paidStatus = invoiceInfo[7];
        assert.equal(paidStatus, false, "Clay didn't pay Meit, so its an error");

        var debteeAddress = debtee.account;
        var debteeBalanceBeforeTx = await web3.fromWei(web3.eth.getBalance(debteeAddress).toNumber(),'ether');

        try {
            await invoicesContract.payInvoice.sendTransaction(1, { from: debtor.account, value: etherAmount });
        } catch (error) {
            console.log(error)
        }

        var debteeBalanceAfterTx = await web3.fromWei(web3.eth.getBalance(debteeAddress).toNumber(),'ether');
        assert.equal(debteeBalanceAfterTx, parseFloat(debteeBalanceBeforeTx) + 2, "Balance of debtee not changed after getting paid!")

        invoiceInfo = await invoicesContract.getInvoice(1);
        paidStatus = invoiceInfo[7];
        assert.equal(paidStatus, true, "Clay paid Meit already!");
    })


    it('Clay fails to pay meit, as clay alreay paid debtee meit for the second invoice', async function () {
        var etherAmount = 10**18;
        var invoiceInfo = await invoicesContract.getInvoice(2);
        var paidStatus = invoiceInfo[7];
        assert.equal(paidStatus, true, "Clay paid meit already!");
    })

})
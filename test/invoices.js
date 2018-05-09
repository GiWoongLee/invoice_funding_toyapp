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
            assert.equal(users[0][1],false,"Issuer exists before creation!")
            assert.equal(users[1][1], false, "Debtee exists before creation!")
            assert.equal(users[2][1], false, "Debtor exists before creation!")
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
            assert.equal(users[0][1], true, "Issuer does not exist before creation!")
            assert.equal(users[1][1], true, "Debtee does not exist before creation!")
            assert.equal(users[2][1], true, "Debtor does not exist before creation!")
        })
        .catch(function (error) {
            console.log(error)
        })

    })

})
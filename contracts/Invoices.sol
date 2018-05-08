pragma solidity ^0.4.21;

contract Invoices{

    struct invoice{ 
        uint256 number; // invoice number
        bool exists; // check existance to prohibit duplicate invoice number
        user issuer; // original invoice creator
        user debtee; // entity who has a right to retrieve money from debtor. On creation, issuer = debtee
        user debtor;  // entity who owes a debt to debtee
        uint256 dollarAmount; // amount of dollar consumer needs to pay to supplier
        uint256 etherAmount; // amount of ether consumer needs to pay to supplier
        uint256 timestamp; // invoice timestamp. NOTE : ethereum uses the unit time representaiton for timestamp
        bool paid; // status whether invoice was paid or not
    }

    struct user{
        address account;
        bool exists;
        bytes32 name;
        bytes32 email;
    }

    address public admin;

    mapping (uint256 => invoice) public invoices; // mapping invoice number to invoice object
    mapping (address => user) public users; // mapping wallet/account address to user object

    constructor () public {
        admin = msg.sender; 
    }

    modifier onlyAdmin() {
        require(msg.sender == admin);
        _;
    }

    function createUser(address _account, bytes32 _name, bytes32 _email) public onlyAdmin{
        require(users[_account].exists != true); // prohibit duplicate account
        bool _exists = true;
        users[_account] = user(_account,_exists,_name,_email);
    }

    // Only Admin could create invoice, as there could be attack from malicious user
    function createInvoice(uint256 _number, address _issuer, address _debtee, address _debtor, uint256 _dollarAmount, uint256 _etherAmount, uint256 _timestamp, bool _paid) public onlyAdmin{
        require(invoices[_number].exists != true); // prohibit duplicate invoice number 
        require(users[_issuer].exists == true); // check issuer exists
        require(users[_debtee].exists == true); // check debtee exists
        require(users[_debtor].exists == true); // check debtor exists
        bool _exists = true;
        invoices[_number] = invoice(_number,_exists,users[_issuer],users[_debtee],users[_debtee],_dollarAmount,_etherAmount,_timestamp,_paid);
    }

    // Function called on searchInvoice
    function getInvoice(uint256 _number) public view returns (uint256 number, bytes32 issuerName, bytes32 debteeName, bytes32 debtorName, uint256 dollarAmount, uint256 etherAmount, uint256 timestamp, bool paid){
        require(invoices[_number].exists == true); // check invoice exists
        invoice storage inv = invoices[_number];
        return (inv.number, inv.issuer.name, inv.debtee.name, inv.debtor.name, inv.dollarAmount, inv.etherAmount, inv.timestamp, inv.paid); 
    } 


}

pragma solidity ^0.4.21;

contract Invoices{

    struct invoice{ 
        uint256 number; // invoice number, should not be 0.
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
        string name;
        string email;
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

    modifier onlyDebtee(uint256 _number) {
        require(invoices[_number].number != 0); // check invoice exists
        require(users[msg.sender].account != 0x0);  // check user exist
        require(msg.sender == invoices[_number].debtee.account); // check msg.sender is the debtee of a invoice
        _;
    }

    modifier onlyDebtor(uint256 _number){
        require(invoices[_number].number != 0); // check invoice exists
        require(users[msg.sender].account != 0x0);  // check user exist
        require(msg.sender == invoices[_number].debtor.account); // check msg.sender is the debtor of a invoice
        _;
    }

    function createUser(address _account, string _name, string _email) public onlyAdmin{
        require(users[_account].account != _account); // prohibit duplicate accounts
        users[_account] = user(_account,_name,_email);
    }

    // Only Admin could create invoice, as there could be attack from malicious user
    function createInvoice(uint256 _number, address _issuer, address _debtee, address _debtor, uint256 _dollarAmount, uint256 _etherAmount, uint256 _timestamp, bool _paid) public onlyAdmin{
        require(invoices[_number].number != _number); // prohibit duplicat invoices
        require(users[_issuer].account != 0x0); // check issuer exists
        require(users[_debtee].account != 0x0); // check debtee exists
        require(users[_debtor].account != 0x0); // check debtor exists
        invoices[_number] = invoice(_number,users[_issuer],users[_debtee],users[_debtor],_dollarAmount,_etherAmount,_timestamp,_paid);
    }

    // Function called on searchInvoice
    function getInvoice(uint256 _number) public view returns (uint256 number, string issuerName, string debteeName, string debtorName, uint256 dollarAmount, uint256 etherAmount, uint256 timestamp, bool paid){
        require(invoices[_number].number != 0); // check invoice exists
        invoice storage inv = invoices[_number];
        return (inv.number, inv.issuer.name, inv.debtee.name, inv.debtor.name, inv.dollarAmount, inv.etherAmount, inv.timestamp, inv.paid); 
    } 
    
    // Function called on FundNow 
    function fundInvoice(uint256 _number) public payable{ 
        require(users[msg.sender].account != 0x0); // check user exists
        require(invoices[_number].number != 0); // check invoice exists
        require(invoices[_number].paid != true); // prohibit duplicate payment
        invoice storage inv = invoices[_number];
        require(msg.value == inv.etherAmount); // check payment amount of ether same as invoice etherAmount
        _sendEther(inv.debtee.account,inv.etherAmount);
        inv.debtee = users[msg.sender]; // change debtee to msg.sender
    }

    // Function when someone pay invoice 
    function payInvoice(uint256 _number) public payable onlyDebtor(_number) {  
        require(invoices[_number].number != 0); // check invoice exists
        invoice storage inv = invoices[_number];
        require(inv.paid != true);
        require(msg.value == inv.etherAmount); // check payment amount of ether same as invoice etherAmount
        _sendEther(inv.debtee.account,inv.etherAmount);
        inv.paid = true;
    }

    function _sendEther(address _receiver,uint256 _amount) internal{
        require(users[_receiver].account != 0x0); // check receiver exists
        _receiver.transfer(_amount);
    }

}


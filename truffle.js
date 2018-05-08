module.exports = {
    networks : {
      development : {
        hosts : "127.0.0.1",
        port : 8545,
        network_id : "*" // match any network id
      },
      crowdz : {
        hosts : "18.144.59.112",
        port : 8545,
        network_id : ""
      }
    }
};

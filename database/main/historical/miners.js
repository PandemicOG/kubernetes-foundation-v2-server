const Text = require('../../../locales/index');

////////////////////////////////////////////////////////////////////////////////

// Main Schema Function
const HistoricalMiners = function (logger, configMain) {

  const _this = this;
  this.logger = logger;
  this.configMain = configMain;
  this.text = Text[configMain.language];

  // Handle Pool Parameters
  this.numbers = ['timestamp', 'efficiency', 'effort', 'hashrate'];
  this.strings = ['miner', 'type'];
  this.parameters = ['timestamp', 'miner', 'efficiency', 'effort', 'hashrate', 'type'];

  // Handle String Parameters
  this.handleStrings = function(parameters, parameter) {
    return ` = '${ parameters[parameter] }'`;
  };

  // Handle Numerical Parameters
  this.handleNumbers = function(parameters, parameter) {
    const query = parameters[parameter];
    if (query.includes('lt')) return ` < ${ query.replace('lt', '') }`;
    if (query.includes('le')) return ` <= ${ query.replace('le', '') }`;
    if (query.includes('gt')) return ` > ${ query.replace('gt', '') }`;
    if (query.includes('ge')) return ` >= ${ query.replace('ge', '') }`;
    if (query.includes('ne')) return ` != ${ query.replace('ne', '') }`;
    else return ` = ${ query }`;
  };

  // Handle Query Parameters
  /* istanbul ignore next */
  this.handleQueries = function(parameters, parameter) {
    if (_this.numbers.includes(parameter)) return _this.handleNumbers(parameters, parameter);
    if (_this.strings.includes(parameter)) return _this.handleStrings(parameters, parameter);
    else return ` = ${ parameters[parameter] }`;
  };

  // Select Pool Miners Using Parameters
  this.selectHistoricalMinersCurrent = function(pool, parameters) {
    let output = `SELECT * FROM "${ pool }".historical_miners`;
    const filtered = Object.keys(parameters).filter((key) => _this.parameters.includes(key));
    filtered.forEach((parameter, idx) => {
      if (idx === 0) output += ' WHERE ';
      else output += ' AND ';
      output += `${ parameter }`;
      output += _this.handleQueries(parameters, parameter);
    });
    return output + ';';
  };

  // Build Miners Values String
  this.buildHistoricalMinersCurrent = function(updates) {
    let values = '';
    updates.forEach((miner, idx) => {
      values += `(
        ${ miner.timestamp },
        ${ miner.recent },
        '${ miner.miner }',
        ${ miner.efficiency },
        ${ miner.effort },
        ${ miner.hashrate },
        '${ miner.type }')`;
      if (idx < updates.length - 1) values += ', ';
    });
    return values;
  };

  // Insert Rows Using Current Data
  this.insertHistoricalMinersCurrent = function(pool, updates) {
    return `
      INSERT INTO "${ pool }".historical_miners (
        timestamp, recent, miner,
        efficiency, effort, hashrate,
        type)
      VALUES ${ _this.buildHistoricalMinersCurrent(updates) }
      ON CONFLICT ON CONSTRAINT historical_miners_recent
      DO NOTHING;`;
  };
};

module.exports = HistoricalMiners;

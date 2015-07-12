function Strategy() {
    this.name = 'DemoAccount';
}

Strategy.prototype.authenticate = function (req) {
    this.success({provider: 'DemoAccount', displayName: 'Demo Account'});
};

module.exports = module.exports.Strategy = Strategy;

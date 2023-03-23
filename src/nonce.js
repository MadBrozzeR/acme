function NonceList () {
  this.first = null;
  this.last = null;
}
function NonceNode (nonce) {
  this.data = nonce;
  this.next = null;
};
NonceList.prototype.put = function (nonce) {
  const node = new NonceNode(nonce);

  this.last && (this.last.next = node);
  this.last = node;
  this.first || (this.first = node);

  return this;
}
NonceList.prototype.get = function () {
  const node = this.first;

  node && (this.first = node.next);
  this.first || (this.last = null);

  return node && node.data;
}
NonceList.prototype.getFromResponse = function (response) {
  if (response.raw && response.raw.headers && response.raw.headers['replay-nonce']) {
    this.put(response.raw.headers['replay-nonce']);
  }

  return this;
}

module.exports = { NonceList };

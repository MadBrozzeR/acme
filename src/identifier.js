const { parseResponse } = require("./utils.js");

function getChallengeByType (challenges, type) {
  for (let index = 0 ; index < challenges.length ; ++index) {
    if (challenges[index].type === type) {
      return challenges[index];
    }
  }

  return null;
}

function Identifier (order, name) {
  this.order = order;
  this.name = name;
}
Identifier.prototype.setAuth = function (link) {
  this.authorization = link;

  return this;
}
Identifier.prototype.getChallenge = function (type = 'http-01') {
  const api = this.order.account.api;
  const thumbprint = this.order.account.getThumbprint();
  const identifier = this;

  return api
    .request(this.authorization)
    .then(parseResponse)
    .then(function (response) {
      if (response.status < 300) {
        const challenge = getChallengeByType(response.data.challenges, type)

        identifier.challenge = challenge && {
          type: challenge.type,
          identifier: response.data.identifier.value,
          expires: response.data.expires,
          status: challenge.status,
          url: challenge.url,
          token: challenge.token,
          key: challenge.token + '.' + thumbprint,
          validationRecord: challenge.validationRecord || null,
        };

        return identifier.challenge;
      }

      throw new api.ResponseError(response);
    })
}
Identifier.prototype.validate = function (type) {
  const api = this.order.account.api;

  if (this.challenge) {
    return api.validationRequest(this.challenge.url);
  } else {
    return this.getChallenge(type).then(function (challenge) {
      return api.validationRequest(challenge.url);
    });
  }
}

module.exports = { Identifier };

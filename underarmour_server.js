var Future = Npm.require('fibers/future');
var request = Npm.require('request')


UnderArmour = {};

OAuth.registerService('underArmour', 2, null, function(query, callback) {

  var accessToken= getTokenResponse(query)
console.log(accessToken)
  var userData = getUserData(accessToken.access_token)

//   var profileData = getProfileData(accessToken)

  var serviceData = {
    accessToken: accessToken.access_token,
    refresgToken: accessToken.refresh_token,
    expiresAt: accessToken.expires_in,
    id: userData.id
  };
console.log(serviceData)
  // include fields from underarmour
  // https://developer.underarmour.com/io-docs
  var whitelisted = ['username', 'location.country', 'gender', 'birthday', 'email', 'display_name'];

  var fields = _.pick(userData, whitelisted);
  _.extend(serviceData, fields);

  return {
    serviceData: serviceData,
    options: {profile: {name: userData.first_name, email: userData.email, fullName: userData.display_name, gender: userData.gender, location: userData.location.country}}
  };
});

var userAgent = "Meteor";
if (Meteor.release)
  userAgent += "/" + Meteor.release;


// returns an object containing:
// - accessToken
// - expiresIn: lifetime of token in seconds
var getTokenResponse = function (query) {

  var config = ServiceConfiguration.configurations.findOne({service: 'underArmour'});
  if (!config)
    throw new ServiceConfiguration.ConfigError();

  var request_params = {
    grant_type: "authorization_code",
    code: query.code,
    client_id: config.client_id,
    client_secret: OAuth.openSecret(config.secret),
    redirect_uri: OAuth._redirectUri('underArmour', config)
    //redirect_uri: OAuth._redirectUri('underarmour', config, null, {replaceLocalhost: true})
  };
  var paramlist = [];
  for (var pk in request_params) {
    paramlist.push(pk + "=" + request_params[pk]);
  };
  var body_string = paramlist.join("&");

  var request_details = {
    method: "POST",
    headers: {'content-type' : 'application/x-www-form-urlencoded', 'Api-Key' : config.client_id},
    uri: 'https://api.ua.com/v7.0/oauth2/uacf/access_token/',
    body: body_string
  };

  var fut = new Future();
  request(request_details, function(error, response, body) {
     var responseContent;
    try {
      responseContent = JSON.parse(body);
    } catch(e) {
      error = new Meteor.Error(204, 'Response is not a valid JSON string.');
      fut.throw(error);
    } finally {
      console.log(responseContent)
      fut.return(responseContent);
    }
  });
  var res = fut.wait();
  return res;
};

//////////////////////////////////////////////// 
// We need to first fetch the UserID
////////////////////////////////////////////////
var getUserData = function (accessToken) {
  var config = ServiceConfiguration.configurations.findOne({service: 'underArmour'});
  
  if (!config)
    throw new ServiceConfiguration.ConfigError();
  
  var fut = new Future();
  var request_user = {
    method: 'GET',
    headers: {'Authorization' : 'Bearer ' + accessToken, 'Api-Key' : config.client_id},
    uri: "https://oauth2-api.mapmyapi.com/v7.0/user/self/"
  };
  request(request_user, function(error, response, body) {
    var responseContent;
    try {
      responseContent = JSON.parse(body);
    } catch(e) {
      error = new Meteor.Error(204, 'Response is not a valid JSON string.');
      fut.throw(error);
    } finally {
      console.log(responseContent)
      fut.return(responseContent);
    }
  });
  var userRes = fut.wait();
  return userRes;
};

//////////////////////////////////////////////// 
// fetch profile data
////////////////////////////////////////////////

// var getProfileData = function (accessToken) {
//   var profileFut = new Future();

//   var request_profile = {
//     method: 'GET',
//     headers: {'Accept': 'application/vnd.com.underarmour.Profile+json',
//               'Authorization' : 'Bearer ' + accessToken}, 'Api-Key' : config.client_id,
//     uri: "https://api.underarmour.com/profile"
//   };
  
//   request(request_profile, function(error, response, body) {
//     var responseContent;
//     try {
//       responseContent = JSON.parse(body);
//     } catch(e) {
//       error = new Meteor.Error(204, 'Response is not a valid JSON string.');
//       profileFut.throw(error);
//     } finally {
//       profileFut.return(responseContent);
//     }
//   });
//   var profileRes= profileFut.wait();
//   return profileRes;
// };

UnderArmour.retrieveCredential = function(credentialToken, credentialSecret) {
  return OAuth.retrieveCredential(credentialToken, credentialSecret);
};

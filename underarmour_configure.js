Template.configureLoginServiceDialogForUnderArmour.helpers({
  siteUrl: function () {
    return Meteor.absoluteUrl();
  }
});
Template.configureLoginServiceDialogForUnderArmour.fields = function () {
  return [
    {property: 'client_id', label: 'Client ID'},
    {property: 'secret', label: 'Client Secret'}
  ];
};
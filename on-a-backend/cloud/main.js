// Per-row ownership. The backend has the permission model; this says whose row it is.
Parse.Cloud.beforeSave('Note', (req) => {
  if (!req.user) throw new Parse.Error(119, 'sign in first');
  if (!req.object.existed()) req.object.setACL(new Parse.ACL(req.user));
});

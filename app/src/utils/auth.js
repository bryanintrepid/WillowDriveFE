// Returns true if the user object represents a kiosk terminal account: they have
// the Kiosk role and no other roles. Used to lock kiosk-terminal sessions to the
// clock-in view in the FE router and login redirect.
export function isKioskUser(user) {
  if (!user) return false
  const roles = Array.isArray(user.roles) ? user.roles : []
  if (roles.length === 0) return false
  return roles.every((r) => String(r).toLowerCase() === 'kiosk')
}

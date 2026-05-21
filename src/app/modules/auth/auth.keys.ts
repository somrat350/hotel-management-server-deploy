const AuthKeys = {
  authLimit: (ip: string, email: string) => `auth:authLimit:${ip}&${email}`,
  pendingUser: (email: string) => `auth:pendingUser:${email}`,
  otp: (email: string) => `auth:otp:${email}`,
  coolDownOtp: (email: string) => `auth:coolDownOtp:${email}`,
  authSession: (hashedRefreshToken: string) =>
    `auth:authSession:${hashedRefreshToken}`,
  sessionKeys: (userId: string) => `auth:sessionKeys:${userId}`,
  userPermission: (userId: string) => `auth:userPermission:${userId}`,
  rolePermission: (roleId: string) => `auth:rolePermission:${roleId}`,
};
export default AuthKeys;

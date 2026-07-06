declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: import("@models/User.model").UserRole;
        email: string;
        planId?: string;
      };
      requestId?: string;
    }
  }
}

export {};